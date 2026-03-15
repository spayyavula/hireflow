#!/usr/bin/env python3
"""
Pressroom — Browserless CMS CLI for JobsSearch
===============================================
Usage:
  python -m tools.pressroom new "Post Title" --category career-playbook
  python -m tools.pressroom enrich path/to/post.md
  python -m tools.pressroom publish path/to/post.md
  python -m tools.pressroom list [--status published]
  python -m tools.pressroom suggest
  python -m tools.pressroom stats
"""

import argparse
import os
import re
import sys
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    import yaml
except ImportError:
    yaml = None

try:
    import markdown as md_lib
except ImportError:
    md_lib = None


CATEGORIES = [
    "career-playbook", "resume-lab", "interview-decoded",
    "hiring-signals", "company-spotlight", "engineering-culture",
    "remote-work", "ai-future-work", "salary-compass", "recruiter-craft",
]

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content" / "posts"
TEMPLATE = dedent("""\
    ---
    title: "{title}"
    slug: {slug}
    author: {author}
    category: {category}
    tags: []
    related_skills: []
    cover_image_url: ""
    status: draft
    featured: false
    excerpt: ""
    seo_title: ""
    seo_description: ""
    seo_keywords: []
    ---

    Write your blog post here...
""")


def slugify(title: str) -> str:
    """Convert title to URL-friendly slug."""
    s = title.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    date = datetime.now().strftime("%Y-%m-%d")
    return f"{date}-{s}"


def parse_frontmatter(filepath: str) -> tuple[dict, str]:
    """Parse YAML frontmatter and markdown body from a file."""
    text = Path(filepath).read_text(encoding="utf-8")
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', text, re.DOTALL)
    if not match:
        print("Error: No valid frontmatter found.")
        sys.exit(1)

    if yaml:
        meta = yaml.safe_load(match.group(1))
    else:
        # Basic fallback parser
        meta = {}
        for line in match.group(1).split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                k, v = k.strip(), v.strip()
                if v.startswith("[") and v.endswith("]"):
                    v = json.loads(v.replace("'", '"'))
                elif v in ("true", "false"):
                    v = v == "true"
                elif v.startswith('"') and v.endswith('"'):
                    v = v[1:-1]
                meta[k] = v

    body = match.group(2).strip()
    return meta, body


def markdown_to_html(text: str) -> str:
    """Convert markdown to HTML."""
    if md_lib:
        return md_lib.markdown(text, extensions=["extra", "codehilite", "toc"])
    # Basic fallback
    html = text
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    paragraphs = html.split("\n\n")
    html = "\n".join(f"<p>{p.strip()}</p>" if not p.strip().startswith("<") else p for p in paragraphs if p.strip())
    return html


def reading_time(text: str) -> int:
    words = len(re.findall(r'\w+', text))
    return max(1, round(words / 238))


# ── Commands ─────────────────────────────────────────────

def cmd_new(args):
    """Create a new blog post from template."""
    title = args.title
    category = args.category or "career-playbook"
    author = args.author or os.environ.get("PRESSROOM_AUTHOR", "Team")
    slug = slugify(title)

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    filepath = CONTENT_DIR / f"{slug}.md"

    if filepath.exists():
        print(f"Error: File already exists: {filepath}")
        sys.exit(1)

    content = TEMPLATE.format(title=title, slug=slug, author=author, category=category)
    filepath.write_text(content, encoding="utf-8")
    print(f"Created: {filepath}")
    print(f"Slug:    {slug}")
    print(f"\nEdit the file, then run:")
    print(f"  python -m tools.pressroom enrich {filepath}")
    print(f"  python -m tools.pressroom publish {filepath}")

    # Open in $EDITOR if set
    editor = os.environ.get("EDITOR")
    if editor:
        os.system(f'{editor} "{filepath}"')


def cmd_enrich(args):
    """AI-enrich a blog post with SEO metadata."""
    from dotenv import load_dotenv
    load_dotenv()

    meta, body = parse_frontmatter(args.file)

    from api.services.blog_ai import enrich_post
    print("Enriching with AI...")
    result = enrich_post(meta.get("title", ""), body, meta.get("category", "career-playbook"))

    meta["excerpt"] = result["excerpt"]
    meta["seo_title"] = result["seo_title"]
    meta["seo_description"] = result["seo_description"]
    meta["seo_keywords"] = result["seo_keywords"]
    meta["reading_time_min"] = result["reading_time_min"]

    if not meta.get("tags") or meta["tags"] == []:
        meta["tags"] = result["suggested_tags"]
    if not meta.get("related_skills") or meta["related_skills"] == []:
        meta["related_skills"] = result["related_skills"]

    # Write back
    if yaml:
        fm = yaml.dump(meta, default_flow_style=False, allow_unicode=True).strip()
    else:
        fm = "\n".join(f"{k}: {json.dumps(v) if isinstance(v, (list, dict)) else v}" for k, v in meta.items())

    content = f"---\n{fm}\n---\n\n{body}\n"
    Path(args.file).write_text(content, encoding="utf-8")

    print(f"Enriched: {args.file}")
    print(f"  Excerpt: {result['excerpt'][:80]}...")
    print(f"  SEO Title: {result['seo_title']}")
    print(f"  Tags: {result['suggested_tags']}")
    print(f"  Related Skills: {result['related_skills']}")
    print(f"  Reading Time: {result['reading_time_min']} min")


def cmd_publish(args):
    """Publish a markdown file to Supabase."""
    from dotenv import load_dotenv
    load_dotenv()

    meta, body = parse_frontmatter(args.file)
    html = markdown_to_html(body)

    import httpx
    api_url = os.environ.get("PRESSROOM_API_URL", "http://localhost:8000")
    token = os.environ.get("PRESSROOM_TOKEN", "")

    if not token:
        print("Error: Set PRESSROOM_TOKEN env var (a valid JWT from the app).")
        sys.exit(1)

    payload = {
        "slug": meta.get("slug", slugify(meta.get("title", "untitled"))),
        "title": meta.get("title", "Untitled"),
        "subtitle": meta.get("subtitle"),
        "body_markdown": body,
        "body_html": html,
        "excerpt": meta.get("excerpt"),
        "cover_image_url": meta.get("cover_image_url") or None,
        "author_name": meta.get("author", "Team"),
        "author_bio": meta.get("author_bio"),
        "category": meta.get("category", "career-playbook"),
        "tags": meta.get("tags", []),
        "related_skills": meta.get("related_skills", []),
        "seo_title": meta.get("seo_title"),
        "seo_description": meta.get("seo_description"),
        "seo_keywords": meta.get("seo_keywords", []),
        "reading_time_min": meta.get("reading_time_min", reading_time(body)),
        "status": "published" if not args.draft else "draft",
        "featured": meta.get("featured", False),
    }

    resp = httpx.post(
        f"{api_url}/api/blog/admin/posts",
        json=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=30,
    )

    if resp.status_code == 201:
        data = resp.json()
        print(f"Published: {data['slug']}")
        print(f"URL: {api_url.replace('http://localhost:8000', 'https://jobssearch.work')}/blog/{data['slug']}")
    elif resp.status_code == 409:
        # Already exists — update instead
        slug = payload["slug"]
        resp2 = httpx.put(
            f"{api_url}/api/blog/admin/posts/{slug}",
            json=payload,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=30,
        )
        if resp2.status_code == 200:
            print(f"Updated: {slug}")
        else:
            print(f"Error updating: {resp2.status_code} — {resp2.text}")
    else:
        print(f"Error: {resp.status_code} — {resp.text}")
        sys.exit(1)


def cmd_list(args):
    """List blog posts from the database."""
    from dotenv import load_dotenv
    load_dotenv()

    from api.core.database import list_blog_posts
    posts = list_blog_posts(status=args.status or "published", limit=args.limit or 20)

    if not posts:
        print("No posts found.")
        return

    print(f"{'Status':<12} {'Views':>6}  {'Title'}")
    print("-" * 60)
    for p in posts:
        status = p.get("status", "?")
        views = p.get("view_count", 0)
        title = p.get("title", "Untitled")[:40]
        slug = p.get("slug", "")
        print(f"{status:<12} {views:>6}  {title}  ({slug})")


def cmd_suggest(args):
    """Suggest blog topics based on job market data."""
    from dotenv import load_dotenv
    load_dotenv()

    from api.core.database import get_active_jobs
    from api.services.blog_ai import suggest_topics

    print("Analyzing job market data...")
    jobs = get_active_jobs()
    print(f"Found {len(jobs)} active jobs. Generating suggestions...\n")

    result = suggest_topics(jobs)
    suggestions = result.get("suggestions", [])

    for i, s in enumerate(suggestions, 1):
        print(f"{i}. {s.get('title', 'Untitled')}")
        print(f"   Category: {s.get('category', '?')}")
        print(f"   Skills: {', '.join(s.get('target_skills', []))}")
        print(f"   Why: {s.get('rationale', '')}")
        print()


def cmd_stats(args):
    """Show blog statistics."""
    from dotenv import load_dotenv
    load_dotenv()

    from api.core.database import count_blog_posts, get_blog_categories_with_counts, list_blog_posts

    published = count_blog_posts("published")
    drafts = count_blog_posts("draft")
    archived = count_blog_posts("archived")

    print(f"Blog Statistics")
    print(f"{'='*40}")
    print(f"Published: {published}")
    print(f"Drafts:    {drafts}")
    print(f"Archived:  {archived}")
    print()

    cats = get_blog_categories_with_counts()
    if cats:
        print("Posts by Category:")
        for c in cats:
            print(f"  {c['category']}: {c['count']}")
        print()

    top = list_blog_posts(status="published", limit=5)
    top.sort(key=lambda x: x.get("view_count", 0), reverse=True)
    if top:
        print("Top Posts by Views:")
        for p in top[:5]:
            print(f"  {p.get('view_count', 0):>5} views  {p.get('title', '?')}")


def cmd_draft(args):
    """Generate an AI draft for a new blog post."""
    from dotenv import load_dotenv
    load_dotenv()

    title = args.title
    category = args.category or "career-playbook"
    author = args.author or os.environ.get("PRESSROOM_AUTHOR", "Team")

    from api.services.blog_ai import generate_draft, compute_reading_time

    print(f"Generating draft: \"{title}\"...")
    body = generate_draft(title, category)
    slug = slugify(title)

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    filepath = CONTENT_DIR / f"{slug}.md"

    meta = {
        "title": title,
        "slug": slug,
        "author": author,
        "category": category,
        "tags": [],
        "related_skills": [],
        "cover_image_url": "",
        "status": "draft",
        "featured": False,
        "excerpt": "",
        "seo_title": "",
        "seo_description": "",
        "seo_keywords": [],
        "reading_time_min": compute_reading_time(body),
    }

    if yaml:
        fm = yaml.dump(meta, default_flow_style=False, allow_unicode=True).strip()
    else:
        fm = "\n".join(f"{k}: {json.dumps(v) if isinstance(v, (list, dict)) else v}" for k, v in meta.items())

    content = f"---\n{fm}\n---\n\n{body}\n"
    filepath.write_text(content, encoding="utf-8")
    print(f"Draft saved: {filepath}")
    print(f"Reading time: ~{meta['reading_time_min']} min")
    print(f"\nNext steps:")
    print(f"  1. Edit the draft")
    print(f"  2. python -m tools.pressroom enrich {filepath}")
    print(f"  3. python -m tools.pressroom publish {filepath}")


# ── Main ─────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        prog="pressroom",
        description="Pressroom — Browserless CMS for JobsSearch",
    )
    sub = parser.add_subparsers(dest="command", help="Available commands")

    # new
    p_new = sub.add_parser("new", help="Create a new blog post")
    p_new.add_argument("title", help="Post title")
    p_new.add_argument("--category", "-c", choices=CATEGORIES, default="career-playbook")
    p_new.add_argument("--author", "-a", help="Author name")

    # enrich
    p_enrich = sub.add_parser("enrich", help="AI-enrich a post with SEO metadata")
    p_enrich.add_argument("file", help="Path to markdown file")

    # publish
    p_pub = sub.add_parser("publish", help="Publish a post to the database")
    p_pub.add_argument("file", help="Path to markdown file")
    p_pub.add_argument("--draft", action="store_true", help="Publish as draft")

    # list
    p_list = sub.add_parser("list", help="List blog posts")
    p_list.add_argument("--status", "-s", choices=["draft", "published", "archived"], default="published")
    p_list.add_argument("--limit", "-n", type=int, default=20)

    # suggest
    sub.add_parser("suggest", help="AI-suggest blog topics from job data")

    # stats
    sub.add_parser("stats", help="Show blog statistics")

    # draft
    p_draft = sub.add_parser("draft", help="Generate an AI draft")
    p_draft.add_argument("title", help="Post title")
    p_draft.add_argument("--category", "-c", choices=CATEGORIES, default="career-playbook")
    p_draft.add_argument("--author", "-a", help="Author name")

    args = parser.parse_args()

    commands = {
        "new": cmd_new,
        "enrich": cmd_enrich,
        "publish": cmd_publish,
        "list": cmd_list,
        "suggest": cmd_suggest,
        "stats": cmd_stats,
        "draft": cmd_draft,
    }

    if args.command in commands:
        commands[args.command](args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

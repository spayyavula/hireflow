/**
 * JobsSearch Mobile API Client
 * Mirrors the web api.js but uses expo-secure-store for token persistence.
 */
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';

let SecureStore = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

const TOKEN_KEY = 'jobssearch_token';

class JobsSearchAPI {
  constructor() {
    this.token = null;
    this._ready = this._loadToken();
  }

  async _loadToken() {
    try {
      if (SecureStore) {
        this.token = await SecureStore.getItemAsync(TOKEN_KEY);
      } else {
        this.token = localStorage.getItem(TOKEN_KEY);
      }
    } catch {
      this.token = null;
    }
  }

  async _saveToken(token) {
    this.token = token;
    if (SecureStore) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  async _clearToken() {
    this.token = null;
    if (SecureStore) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  async _fetch(path, opts = {}) {
    await this._ready;
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, { headers: this._headers(), ...opts });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `API error ${res.status}`);
    }
    return res.json();
  }

  // ─── Auth ─────────────────────────────────────────────
  async register(email, password, role, name, companyName = null) {
    const body = { email, password, role, name };
    if (companyName) body.company_name = companyName;
    const data = await this._fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    await this._saveToken(data.access_token);
    return data;
  }

  async login(email, password) {
    const data = await this._fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this._saveToken(data.access_token);
    return data;
  }

  async logout() {
    await this._clearToken();
  }

  isLoggedIn() {
    return !!this.token;
  }

  // ─── Seeker ───────────────────────────────────────────
  async getProfile() {
    return this._fetch('/api/seeker/profile');
  }

  async updateProfile(profile) {
    return this._fetch('/api/seeker/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  async getMatches(minScore = 0) {
    return this._fetch(`/api/seeker/matches?min_score=${minScore}`);
  }

  async generateAISummary() {
    return this._fetch('/api/seeker/ai-summary', { method: 'POST' });
  }

  // ─── Jobs ─────────────────────────────────────────────
  async searchExternalJobs(query = '', location = '', remoteOnly = false, page = 1) {
    const params = new URLSearchParams({ query, location, remote_only: remoteOnly, page });
    return this._fetch(`/api/jobs/search?${params}`);
  }

  async getJobs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this._fetch(`/api/jobs${qs ? '?' + qs : ''}`);
  }

  async applyToJob(jobId, coverLetter = '') {
    return this._fetch(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ cover_letter: coverLetter }),
    });
  }

  async getMyApplications() {
    return this._fetch('/api/jobs/me/applications');
  }

  // ─── Recruiter ────────────────────────────────────────
  async searchCandidates(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this._fetch(`/api/recruiter/candidates${qs ? '?' + qs : ''}`);
  }

  async getRecruiterPipeline() {
    return this._fetch('/api/recruiter/pipeline');
  }

  async getRecruiterAnalytics() {
    return this._fetch('/api/recruiter/analytics');
  }

  // ─── Company ──────────────────────────────────────────
  async getCompanyDashboard() {
    return this._fetch('/api/company/dashboard');
  }

  async getCompanyAnalytics() {
    return this._fetch('/api/company/analytics');
  }

  // ─── Matcher ──────────────────────────────────────────
  async analyzeMatch(payload) {
    return this._fetch('/api/matcher/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async generateCoverLetter(payload) {
    return this._fetch('/api/matcher/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ─── Feature Requests ─────────────────────────────────
  async listFeatures(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this._fetch(`/api/features${qs ? '?' + qs : ''}`);
  }

  async createFeature(payload) {
    return this._fetch('/api/features', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async voteFeature(id) {
    return this._fetch(`/api/features/${id}/vote`, { method: 'POST' });
  }

  async getFeatureComments(id) {
    return this._fetch(`/api/features/${id}/comments`);
  }

  async addFeatureComment(id, content) {
    return this._fetch(`/api/features/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // ─── Blog ──────────────────────────────────────────────
  async getBlogPosts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this._fetch(`/api/blog${qs ? '?' + qs : ''}`);
  }

  async getBlogPost(slug) {
    return this._fetch(`/api/blog/${slug}`);
  }

  async getBlogCategories() {
    return this._fetch('/api/blog/categories');
  }

  async getRelatedJobsForPost(slug) {
    return this._fetch(`/api/blog/${slug}/related-jobs`);
  }

  // ─── Chat ─────────────────────────────────────────────
  async sendMessage(recipientId, content) {
    return this._fetch('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId, content }),
    });
  }

  async getConversations() {
    return this._fetch('/api/chat/conversations');
  }

  async getMessages(conversationId) {
    return this._fetch(`/api/chat/conversations/${conversationId}/messages`);
  }
}

const api = new JobsSearchAPI();
export default api;

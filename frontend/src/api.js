/**
 * HireFlow API Client
 * Connects the React frontend to the FastAPI backend.
 *
 * Usage:
 *   import api from './api';
 *   const { token } = await api.login('user@example.com', 'password');
 *   const jobs = await api.getJobs();
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

class HireFlowAPI {
  constructor() {
    this.token = localStorage.getItem('hireflow_token') || null;
  }

  // ─── Internal ─────────────────────────────────────────
  _headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  }

  async _fetch(path, opts = {}) {
    const url = `${BASE_URL}${path}`;
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
    this.token = data.access_token;
    localStorage.setItem('hireflow_token', this.token);
    return data;
  }

  async login(email, password) {
    const data = await this._fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = data.access_token;
    localStorage.setItem('hireflow_token', this.token);
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('hireflow_token');
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

  async uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/api/seeker/resume/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Upload failed (${res.status})`);
    }
    return res.json();
  }

  async getMatches(minScore = 0) {
    return this._fetch(`/api/seeker/matches?min_score=${minScore}`);
  }

  async generateAISummary() {
    return this._fetch('/api/seeker/ai-summary', { method: 'POST' });
  }

  // ─── Jobs ─────────────────────────────────────────────
  async getJobs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this._fetch(`/api/jobs${qs ? '?' + qs : ''}`);
  }

  async getJob(id) {
    return this._fetch(`/api/jobs/${id}`);
  }

  async createJob(job) {
    return this._fetch('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    });
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

const api = new HireFlowAPI();
export default api;

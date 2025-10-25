import { loadJobs, addJobAPI, updateJobAPI, deleteJobAPI } from './api.js';

class JobTracker {
    constructor() {
        this.jobs = [];
        this.token = localStorage.getItem('token');
        this.currentEditId = null;
        this.init();
    }

    async loadJobs() {
        try {
            this.jobs = await loadJobs(this.token);
            this.renderJobs();
            this.updateStatistics();
        } catch (err) {
            console.error(err);
            this.showNotification(err.message, 'error');
        }
    }

    async addJob() {
        const formData = new FormData(document.getElementById('jobForm'));
        const job = {
            company: formData.get('company'),
            position: formData.get('position'),
            status: formData.get('status'),
            dateApplied: formData.get('dateApplied'),
            salary: formData.get('salary') || '',
            location: formData.get('location') || '',
            jobUrl: formData.get('jobUrl') || '',
            notes: formData.get('notes') || ''
        };

        try {
            const newJob = await addJobAPI(this.token, job);
            this.jobs.push(newJob);
            this.renderJobs();
            this.updateStatistics();
            this.resetForm();
            this.showNotification('Job added successfully!', 'success');
        } catch (err) {
            console.error(err);
            this.showNotification(err.message, 'error');
        }
    }

    async updateJob() {
        const formData = new FormData(document.getElementById('editJobForm'));
        const jobId = document.getElementById('editJobId').value;

        const updatedJob = {
            company: formData.get('company'),
            position: formData.get('position'),
            status: formData.get('status'),
            dateApplied: formData.get('dateApplied'),
            salary: formData.get('salary') || '',
            location: formData.get('location') || '',
            jobUrl: formData.get('jobUrl') || '',
            notes: formData.get('notes') || ''
        };

        try {
            const job = await updateJobAPI(this.token, jobId, updatedJob);
            const index = this.jobs.findIndex(j => j._id === jobId);
            if (index !== -1) this.jobs[index] = job;

            this.renderJobs();
            this.updateStatistics();
            this.closeModal();
            this.showNotification('Job updated successfully!', 'success');
        } catch (err) {
            console.error(err);
            this.showNotification(err.message, 'error');
        }
    }

    async deleteJob(jobId) {
        if (!confirm('Are you sure you want to delete this job?')) return;

        try {
            await deleteJobAPI(this.token, jobId);
            this.jobs = this.jobs.filter(job => job._id !== jobId);
            this.renderJobs();
            this.updateStatistics();
            this.showNotification('Job deleted successfully!', 'success');
        } catch (err) {
            console.error(err);
            this.showNotification(err.message, 'error');
        }
    }
}

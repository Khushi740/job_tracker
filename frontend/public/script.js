class JobTracker {
    constructor() {
        this.jobs = JSON.parse(localStorage.getItem('jobs')) || [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderJobs();
        this.updateStatistics();
    }

    bindEvents() {
        // Form submission
        document.getElementById('jobForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addJob();
        });

        // Edit form submission
        document.getElementById('editJobForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateJob();
        });

        // Search and filter
        document.getElementById('searchInput').addEventListener('input', () => {
            this.renderJobs();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.renderJobs();
        });

        // Modal events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('editModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    addJob() {
        const formData = new FormData(document.getElementById('jobForm'));
        const job = {
            id: Date.now().toString(),
            company: formData.get('company'),
            position: formData.get('position'),
            status: formData.get('status'),
            dateApplied: formData.get('dateApplied'),
            salary: formData.get('salary') || '',
            location: formData.get('location') || '',
            jobUrl: formData.get('jobUrl') || '',
            notes: formData.get('notes') || '',
            dateAdded: new Date().toISOString()
        };

        this.jobs.push(job);
        this.saveJobs();
        this.renderJobs();
        this.updateStatistics();
        this.resetForm();
        this.showNotification('Job application added successfully!', 'success');
    }

    updateJob() {
        const formData = new FormData(document.getElementById('editJobForm'));
        const jobId = document.getElementById('editJobId').value;
        
        const jobIndex = this.jobs.findIndex(job => job.id === jobId);
        if (jobIndex !== -1) {
            this.jobs[jobIndex] = {
                ...this.jobs[jobIndex],
                company: formData.get('company'),
                position: formData.get('position'),
                status: formData.get('status'),
                dateApplied: formData.get('dateApplied'),
                salary: formData.get('salary') || '',
                location: formData.get('location') || '',
                jobUrl: formData.get('jobUrl') || '',
                notes: formData.get('notes') || ''
            };

            this.saveJobs();
            this.renderJobs();
            this.updateStatistics();
            this.closeModal();
            this.showNotification('Job application updated successfully!', 'success');
        }
    }

    editJob(jobId) {
        const job = this.jobs.find(job => job.id === jobId);
        if (!job) return;

        // Populate edit form
        document.getElementById('editJobId').value = job.id;
        document.getElementById('editCompany').value = job.company;
        document.getElementById('editPosition').value = job.position;
        document.getElementById('editStatus').value = job.status;
        document.getElementById('editDateApplied').value = job.dateApplied;
        document.getElementById('editSalary').value = job.salary;
        document.getElementById('editLocation').value = job.location;
        document.getElementById('editJobUrl').value = job.jobUrl;
        document.getElementById('editNotes').value = job.notes;

        // Show modal
        document.getElementById('editModal').style.display = 'block';
    }

    deleteJob(jobId) {
        if (confirm('Are you sure you want to delete this job application?')) {
            this.jobs = this.jobs.filter(job => job.id !== jobId);
            this.saveJobs();
            this.renderJobs();
            this.updateStatistics();
            this.showNotification('Job application deleted successfully!', 'success');
        }
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.currentEditId = null;
    }

    renderJobs() {
        const jobsList = document.getElementById('jobsList');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredJobs = this.jobs;

        // Apply search filter
        if (searchTerm) {
            filteredJobs = filteredJobs.filter(job => 
                job.company.toLowerCase().includes(searchTerm) ||
                job.position.toLowerCase().includes(searchTerm)
            );
        }

        // Apply status filter
        if (statusFilter) {
            filteredJobs = filteredJobs.filter(job => job.status === statusFilter);
        }

        // Sort by date applied (newest first)
        filteredJobs.sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));

        if (filteredJobs.length === 0) {
            jobsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>No job applications found</h3>
                    <p>${this.jobs.length === 0 ? 'Add your first job application using the form above!' : 'Try adjusting your search or filter criteria.'}</p>
                </div>
            `;
            return;
        }

        jobsList.innerHTML = filteredJobs.map(job => this.createJobCard(job)).join('');
    }

    createJobCard(job) {
        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        const formatSalary = (salary) => {
            if (!salary) return '';
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            }).format(salary);
        };

        return `
            <div class="job-card">
                <div class="job-header">
                    <div class="job-info">
                        <h3>${job.company}</h3>
                        <p>${job.position}</p>
                    </div>
                    <span class="job-status status-${job.status}">
                        ${job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                </div>
                
                <div class="job-details">
                    <div class="job-detail">
                        <i class="fas fa-calendar"></i>
                        <span>Applied: ${formatDate(job.dateApplied)}</span>
                    </div>
                    ${job.salary ? `
                        <div class="job-detail">
                            <i class="fas fa-dollar-sign"></i>
                            <span>Salary: ${formatSalary(job.salary)}</span>
                        </div>
                    ` : ''}
                    ${job.location ? `
                        <div class="job-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${job.location}</span>
                        </div>
                    ` : ''}
                    ${job.jobUrl ? `
                        <div class="job-detail">
                            <i class="fas fa-link"></i>
                            <a href="${job.jobUrl}" target="_blank" rel="noopener noreferrer" class="job-url">
                                View Job Posting
                            </a>
                        </div>
                    ` : ''}
                </div>
                
                ${job.notes ? `
                    <div class="job-notes">
                        <strong>Notes:</strong> ${job.notes}
                    </div>
                ` : ''}
                
                <div class="job-actions">
                    <button onclick="jobTracker.editJob('${job.id}')" class="btn btn-edit">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="jobTracker.deleteJob('${job.id}')" class="btn btn-danger">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    updateStatistics() {
        const stats = {
            totalApplied: this.jobs.length,
            totalInterviews: this.jobs.filter(job => job.status === 'interview').length,
            totalOffers: this.jobs.filter(job => job.status === 'offer').length,
            totalRejected: this.jobs.filter(job => job.status === 'rejected').length
        };

        document.getElementById('totalApplied').textContent = stats.totalApplied;
        document.getElementById('totalInterviews').textContent = stats.totalInterviews;
        document.getElementById('totalOffers').textContent = stats.totalOffers;
        document.getElementById('totalRejected').textContent = stats.totalRejected;
    }

    saveJobs() {
        localStorage.setItem('jobs', JSON.stringify(this.jobs));
    }

    resetForm() {
        document.getElementById('jobForm').reset();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 2000;
            transition: all 0.3s ease;
            transform: translateX(100%);
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#212529';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Export data to JSON
    exportData() {
        const dataStr = JSON.stringify(this.jobs, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `job-applications-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Import data from JSON
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedJobs = JSON.parse(e.target.result);
                if (Array.isArray(importedJobs)) {
                    this.jobs = importedJobs;
                    this.saveJobs();
                    this.renderJobs();
                    this.updateStatistics();
                    this.showNotification('Data imported successfully!', 'success');
                } else {
                    this.showNotification('Invalid file format!', 'error');
                }
            } catch (error) {
                this.showNotification('Error importing data!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the job tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.jobTracker = new JobTracker();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC key to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('editModal');
        if (modal.style.display === 'block') {
            jobTracker.closeModal();
        }
    }
});

// Set default date to today
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateApplied').value = today;
});

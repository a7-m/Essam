/**
 * =====================================================
 * Admin Sidebar Component
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

function renderAdminSidebar(activePage = '') {
    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar) return;

    const navItems = [
        { id: 'dashboard', label: 'لوحة التحكم', icon: '📊', url: 'dashboard.html' },
        { id: 'students', label: 'الطلاب', icon: '👥', url: 'students.html' },
        { id: 'submissions', label: 'التسليمات', icon: '📤', url: 'submissions.html' },
        { id: 'subjects', label: 'المواد والوحدات', icon: '📚', url: 'subjects.html' },
        { id: 'lessons', label: 'الدروس والملفات', icon: '📝', url: 'lessons.html' },
        { id: 'homeworks', label: 'الواجبات', icon: '🏠', url: 'homeworks.html' },
        { id: 'exams', label: 'الاختبارات', icon: '📝', url: 'exams.html' },
        { id: 'analytics', label: 'التحليلات', icon: '📈', url: 'analytics.html' },
        { id: 'profile', label: 'الملف الشخصي', icon: '👤', url: 'profile.html' }
    ];

    sidebar.innerHTML = `
        <div class="sidebar-logo">الأستاذ عصام</div>
        <nav class="sidebar-nav">
            ${navItems.map(item => `
                <li class="nav-item">
                    <a href="${item.url}" class="nav-link ${activePage === item.id ? 'active' : ''}">
                        <span>${item.icon}</span> ${item.label}
                    </a>
                </li>
            `).join('')}
        </nav>
        <div class="sidebar-footer">
            <button class="btn btn-danger btn-block" onclick="authService.signOut()">🚪 تسجيل الخروج</button>
        </div>
    `;
}

window.renderAdminSidebar = renderAdminSidebar;

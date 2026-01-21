class OnceADay {
    constructor() {
        this.userRole = null;
        this.lastCheckTime = null;
        this.notificationInterval = 2; // 기본 2일
        this.guardians = [];
        this.elders = [];

        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
        this.showInitialScreen();
        this.updateUI();
    }

    loadSettings() {
        const savedRole = localStorage.getItem('userRole');
        const savedLastCheck = localStorage.getItem('lastCheckTime');
        const savedInterval = localStorage.getItem('notificationInterval');
        const savedGuardians = localStorage.getItem('guardians');
        const savedElders = localStorage.getItem('elders');

        if (savedRole) {
            this.userRole = savedRole;
        }
        if (savedLastCheck) {
            this.lastCheckTime = new Date(savedLastCheck);
        }
        if (savedInterval) {
            this.notificationInterval = parseInt(savedInterval);
        }
        if (savedGuardians) {
            this.guardians = JSON.parse(savedGuardians);
        }
        if (savedElders) {
            this.elders = JSON.parse(savedElders);
        }
    }

    saveSettings() {
        if (this.userRole) {
            localStorage.setItem('userRole', this.userRole);
        }
        if (this.lastCheckTime) {
            localStorage.setItem('lastCheckTime', this.lastCheckTime.toISOString());
        }
        localStorage.setItem('notificationInterval', this.notificationInterval);
        localStorage.setItem('guardians', JSON.stringify(this.guardians));
        localStorage.setItem('elders', JSON.stringify(this.elders));
    }

    showInitialScreen() {
        const screens = ['roleSelection', 'elderMain', 'guardianMain'];
        screens.forEach(screenId => {
            document.getElementById(screenId).classList.add('hidden');
        });

        if (!this.userRole) {
            document.getElementById('roleSelection').classList.remove('hidden');
        } else if (this.userRole === 'elder') {
            document.getElementById('elderMain').classList.remove('hidden');
        } else if (this.userRole === 'guardian') {
            document.getElementById('guardianMain').classList.remove('hidden');
        }
    }

    bindEvents() {
        document.getElementById('elderBtn').addEventListener('click', () => {
            this.setUserRole('elder');
        });

        document.getElementById('guardianBtn').addEventListener('click', () => {
            this.setUserRole('guardian');
        });

        document.getElementById('checkInBtn').addEventListener('click', () => {
            this.checkIn();
        });

        document.getElementById('addGuardianBtn').addEventListener('click', () => {
            this.addGuardian();
        });

        document.getElementById('addElderBtn').addEventListener('click', () => {
            this.addElder();
        });
    }

    setUserRole(role) {
        this.userRole = role;
        this.saveSettings();
        this.showInitialScreen();
        this.updateUI();

        // 웹뷰와 네이티브 앱 간 통신 (필요시)
        if (typeof window.Android !== 'undefined') {
            window.Android.onRoleSelected(role);
        } else if (typeof window.webkit !== 'undefined' && window.webkit.messageHandlers.onRoleSelected) {
            window.webkit.messageHandlers.onRoleSelected.postMessage(role);
        }
    }

    checkIn() {
        this.lastCheckTime = new Date();
        this.saveSettings();
        this.updateUI();

        // 체크인 성공 피드백
        const button = document.getElementById('checkInBtn');
        const originalText = button.textContent;
        button.textContent = '확인됨! ✓';
        button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';

        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);

        // 보호자들에게 알림 전송 (웹뷰 → 네이티브 앱)
        this.notifyGuardians('check_in');
    }

    addGuardian() {
        const phone = prompt('보호자의 전화번호를 입력하세요:');
        if (phone) {
            const name = prompt('보호자의 이름을 입력하세요:');
            if (name) {
                this.guardians.push({ name, phone, addedAt: new Date() });
                this.saveSettings();
                this.updateGuardianList();
            }
        }
    }

    addElder() {
        const phone = prompt('어르신의 전화번호를 입력하세요:');
        if (phone) {
            const name = prompt('어르신의 이름을 입력하세요:');
            if (name) {
                this.elders.push({ name, phone, lastCheck: null, addedAt: new Date() });
                this.saveSettings();
                this.updateElderList();
            }
        }
    }

    updateUI() {
        if (this.userRole === 'elder') {
            this.updateElderUI();
        } else if (this.userRole === 'guardian') {
            this.updateGuardianUI();
        }
    }

    updateElderUI() {
        const lastCheckEl = document.getElementById('lastCheck');
        const nextNotificationEl = document.getElementById('nextNotification');

        if (this.lastCheckTime) {
            lastCheckEl.textContent = this.formatDateTime(this.lastCheckTime);

            const nextTime = new Date(this.lastCheckTime);
            nextTime.setDate(nextTime.getDate() + this.notificationInterval);
            nextNotificationEl.textContent = this.formatDateTime(nextTime);
        } else {
            lastCheckEl.textContent = '아직 확인하지 않음';
            nextNotificationEl.textContent = '지금 확인해주세요';
        }

        this.updateGuardianList();
    }

    updateGuardianUI() {
        this.updateElderList();
    }

    updateGuardianList() {
        const listEl = document.getElementById('guardianList');
        if (this.guardians.length === 0) {
            listEl.innerHTML = '<p>등록된 보호자가 없습니다</p>';
        } else {
            listEl.innerHTML = this.guardians.map(guardian =>
                `<div class="guardian-item">
                    <strong>${guardian.name}</strong><br>
                    <small>${guardian.phone}</small>
                </div>`
            ).join('');
        }
    }

    updateElderList() {
        const listEl = document.getElementById('elderList');
        if (this.elders.length === 0) {
            listEl.innerHTML = '<p>등록된 어르신이 없습니다</p>';
        } else {
            listEl.innerHTML = this.elders.map(elder =>
                `<div class="elder-item">
                    <strong>${elder.name}</strong><br>
                    <small>${elder.phone}</small><br>
                    <small>마지막 확인: ${elder.lastCheck ? this.formatDateTime(new Date(elder.lastCheck)) : '없음'}</small>
                </div>`
            ).join('');
        }
    }

    formatDateTime(date) {
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}일 전`;
        } else if (hours > 0) {
            return `${hours}시간 전`;
        } else {
            return '방금 전';
        }
    }

    notifyGuardians(type, data = {}) {
        // 네이티브 앱과 통신하여 보호자들에게 알림 전송
        const message = {
            type: type,
            timestamp: new Date(),
            elderData: data,
            guardians: this.guardians
        };

        if (typeof window.Android !== 'undefined') {
            window.Android.notifyGuardians(JSON.stringify(message));
        } else if (typeof window.webkit !== 'undefined' && window.webkit.messageHandlers.notifyGuardians) {
            window.webkit.messageHandlers.notifyGuardians.postMessage(message);
        }
    }

    // 네이티브 앱에서 호출할 수 있는 메소드들
    triggerNotification() {
        if (this.userRole === 'elder') {
            // 알림 트리거 시 UI 업데이트
            const checkInBtn = document.getElementById('checkInBtn');
            checkInBtn.style.animation = 'pulse 1s infinite';

            // 진동 효과 (지원되는 경우)
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
        }
    }

    updateElderStatus(elderPhone, lastCheckTime) {
        const elder = this.elders.find(e => e.phone === elderPhone);
        if (elder) {
            elder.lastCheck = lastCheckTime;
            this.saveSettings();
            this.updateElderList();
        }
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.onceADayApp = new OnceADay();
});

// 네이티브 앱에서 접근할 수 있도록 전역 함수로 노출
window.triggerNotification = () => {
    if (window.onceADayApp) {
        window.onceADayApp.triggerNotification();
    }
};

window.updateElderStatus = (elderPhone, lastCheckTime) => {
    if (window.onceADayApp) {
        window.onceADayApp.updateElderStatus(elderPhone, lastCheckTime);
    }
};
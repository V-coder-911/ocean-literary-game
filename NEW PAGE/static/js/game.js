/**
 * OceanQuest - Core Game Client Scripts
 * Shared utility functions for animations, counters, and alerts.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("OceanQuest Marine telemetry initialized.");
    
    // Smooth numbers increment effect for dashboard counters
    const counterElements = document.querySelectorAll('.stat-val');
    counterElements.forEach(el => {
        const valStr = el.innerText.replace(/,/g, '').replace(/%/g, '').replace(/#/g, '');
        const target = parseFloat(valStr);
        
        if (isNaN(target)) return;
        
        let start = 0;
        const duration = 1200; // ms
        const stepTime = 25; // ms
        const steps = duration / stepTime;
        const increment = target / steps;
        
        const isPercentage = el.innerText.includes('%');
        const isRank = el.innerText.includes('#');
        
        let currentStep = 0;
        const timer = setInterval(() => {
            currentStep++;
            start += increment;
            
            if (currentStep >= steps) {
                clearInterval(timer);
                el.innerText = (isRank ? '#' : '') + Math.round(target) + (isPercentage ? '%' : '');
            } else {
                el.innerText = (isRank ? '#' : '') + Math.round(start) + (isPercentage ? '%' : '');
            }
        }, stepTime);
    });

    // Custom alerts fade effect
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(msg => {
        setTimeout(() => {
            msg.style.transition = 'opacity 0.6s ease';
            msg.style.opacity = '0';
            setTimeout(() => msg.remove(), 600);
        }, 5000);
    });
});

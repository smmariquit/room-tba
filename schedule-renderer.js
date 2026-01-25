class ScheduleRenderer {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.config = {
            width: 800,
            height: 450,
            headerHeight: 32,
            timeColumnWidth: 55,
            startHour: 7,
            endHour: 20,
            days: ['M', 'T', 'W', 'Th', 'F', 'S'],
            colors: {
                background: '#FFFFFF',
                header: '#1a1a1a',
                headerText: '#FFFFFF',
                grid: '#e5e5e5',
                gridLight: '#f0f0f0',
                timeColumn: '#333333',
                timeText: '#FFFFFF'
            },
            fonts: {
                header: 'bold 13px Arial, sans-serif',
                time: '10px Arial, sans-serif',
                course: 'bold 9px Arial, sans-serif',
                section: '8px Arial, sans-serif'
            },
            ...config
        };
        
        this.courses = [];
        this.init();
    }
    
    init() {
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
        this.cellWidth = (this.config.width - this.config.timeColumnWidth) / this.config.days.length;
        this.cellHeight = (this.config.height - this.config.headerHeight) / (this.config.endHour - this.config.startHour);
        this.draw();
    }
    
    draw() {
        const ctx = this.ctx;
        const cfg = this.config;
        
        ctx.fillStyle = cfg.colors.background;
        ctx.fillRect(0, 0, cfg.width, cfg.height);
        
        ctx.strokeStyle = cfg.colors.gridLight;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < (cfg.endHour - cfg.startHour); i++) {
            const y = cfg.headerHeight + (i * this.cellHeight) + (this.cellHeight / 2);
            ctx.beginPath();
            ctx.moveTo(cfg.timeColumnWidth, y);
            ctx.lineTo(cfg.width, y);
            ctx.stroke();
        }
        
        ctx.fillStyle = cfg.colors.header;
        ctx.fillRect(0, 0, cfg.width, cfg.headerHeight);
        
        ctx.fillStyle = cfg.colors.timeColumn;
        ctx.fillRect(0, cfg.headerHeight, cfg.timeColumnWidth, cfg.height - cfg.headerHeight);
        
        ctx.fillStyle = cfg.colors.headerText;
        ctx.font = cfg.fonts.header;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        cfg.days.forEach((day, i) => {
            const x = cfg.timeColumnWidth + (i * this.cellWidth) + (this.cellWidth / 2);
            ctx.fillText(day, x, cfg.headerHeight / 2);
        });
        
        ctx.fillStyle = cfg.colors.timeText;
        ctx.font = cfg.fonts.time;
        ctx.textAlign = 'center';
        
        for (let hour = cfg.startHour; hour < cfg.endHour; hour++) {
            const y = cfg.headerHeight + ((hour - cfg.startHour) * this.cellHeight) + (this.cellHeight / 2);
            const displayHour = hour > 12 ? hour - 12 : hour;
            const period = hour >= 12 ? 'PM' : 'AM';
            const label = `${displayHour}:00`;
            ctx.fillText(label, cfg.timeColumnWidth / 2, y);
        }
        
        ctx.strokeStyle = cfg.colors.grid;
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= (cfg.endHour - cfg.startHour); i++) {
            const y = cfg.headerHeight + (i * this.cellHeight);
            ctx.beginPath();
            ctx.moveTo(cfg.timeColumnWidth, y);
            ctx.lineTo(cfg.width, y);
            ctx.stroke();
        }
        
        for (let i = 0; i <= cfg.days.length; i++) {
            const x = cfg.timeColumnWidth + (i * this.cellWidth);
            ctx.beginPath();
            ctx.moveTo(x, cfg.headerHeight);
            ctx.lineTo(x, cfg.height);
            ctx.stroke();
        }
        
        this.courses.forEach(course => this.drawCourse(course));
    }
    
    addCourse(course) {
        this.courses.push(course);
        this.drawCourse(course);
    }
    
    drawCourse(course) {
        const ctx = this.ctx;
        const cfg = this.config;
        
        const dayIndices = this.parseDays(course.day);
        const [startTime, endTime] = this.parseTime(course.time);
        
        if (startTime === null || endTime === null) {
            console.warn('Could not parse time:', course.time);
            return;
        }
        
        dayIndices.forEach(dayIndex => {
            if (dayIndex < 0 || dayIndex >= cfg.days.length) return;
            
            const x = cfg.timeColumnWidth + (dayIndex * this.cellWidth) + 1;
            const y = cfg.headerHeight + ((startTime - cfg.startHour) * this.cellHeight) + 1;
            const width = this.cellWidth - 2;
            const height = ((endTime - startTime) * this.cellHeight) - 2;
            
            if (height <= 0) return;
            
            ctx.fillStyle = course.color || '#2E7D32';
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const centerX = x + width / 2;
            const padding = 3;
            let textY = y + padding;
            
            ctx.font = cfg.fonts.course;
            const courseCode = this.truncateText(course.courseCode, width - 6);
            ctx.fillText(courseCode, centerX, textY);
            textY += 11;
            
            if (height > 28 && course.section) {
                ctx.font = cfg.fonts.section;
                const section = this.truncateText(course.section, width - 6);
                ctx.fillText(section, centerX, textY);
            }
        });
    }
    
    parseDays(dayStr) {
        const dayMap = { 'M': 0, 'T': 1, 'W': 2, 'Th': 3, 'F': 4, 'S': 5 };
        const indices = [];
        
        let str = dayStr;
        
        if (str.includes('Th')) {
            indices.push(3);
            str = str.replace(/Th/g, '');
        }
        
        for (const char of str) {
            if (dayMap.hasOwnProperty(char) && char !== 'h') {
                indices.push(dayMap[char]);
            }
        }
        
        return [...new Set(indices)].sort((a, b) => a - b);
    }
    
    parseTime(timeStr) {
        const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?-(\d{1,2})(?::(\d{2}))?$/);
        if (!match) {
            console.warn('Time parse failed:', timeStr);
            return [null, null];
        }
        
        let startHour = parseInt(match[1]);
        let startMin = match[2] ? parseInt(match[2]) : 0;
        let endHour = parseInt(match[3]);
        let endMin = match[4] ? parseInt(match[4]) : 0;
        
        if (startHour >= 1 && startHour <= 6) startHour += 12;
        if (endHour >= 1 && endHour <= 6) endHour += 12;
        if (endHour === 7 && startHour > 7) endHour += 12;
        
        const start = startHour + (startMin / 60);
        const end = endHour + (endMin / 60);
        
        return [start, end];
    }
    
    truncateText(text, maxWidth) {
        const ctx = this.ctx;
        if (!text) return '';
        if (ctx.measureText(text).width <= maxWidth) return text;
        
        let truncated = text;
        while (truncated.length > 0 && ctx.measureText(truncated + '..').width > maxWidth) {
            truncated = truncated.slice(0, -1);
        }
        return truncated.length > 0 ? truncated + '..' : '';
    }
    
    clear() {
        this.courses = [];
        this.draw();
    }
}

window.ScheduleRenderer = ScheduleRenderer;

// Calendar Functionality
// Extends the main app object with calendar-specific logic

if (typeof app !== 'undefined') {
    Object.assign(app, {
        // --- CALENDAR ---
        renderCalendar() {
            const container = document.getElementById('calendar-container');
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            // Update Header
            const header = document.getElementById('calendar-month-display');
            if (header) header.innerText = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

            const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            const daysInMonth = lastDay.getDate();

            // Adjustment for Start on Monday
            let startingDay = firstDay.getDay(); // 0 = Sunday
            let dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

            if (this.state.calendarStartMonday) {
                dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                startingDay = startingDay === 0 ? 6 : startingDay - 1;
            }

            let html = '<div class="grid grid-cols-7 gap-1 text-center mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">';
            dayLabels.forEach(d => html += `<div>${d}</div>`);
            html += '</div><div class="grid grid-cols-7 gap-2">';

            // Empty cells
            for (let i = 0; i < startingDay; i++) {
                html += '<div class="aspect-square"></div>';
            }

            // Days
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${this.currentDate.getFullYear()}-${String(this.currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                // Check if has tasks
                const hasTask = this.state.tasks.some(t => t.dueDate === dateStr);

                // Check if Today
                const isToday = new Date().toDateString() === new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), d).toDateString();
                const activeClass = isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : (hasTask ? 'bg-primary/10 text-primary' : 'text-slate-700 dark:text-gray-300');

                html += `
                    <div class="aspect-square rounded-full flex flex-col items-center justify-center text-sm font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${activeClass}" onclick="app.openDayTasksModal('${dateStr}')">
                        ${d}
                        ${hasTask && !isToday ? '<span class="w-1 h-1 bg-current rounded-full mt-1"></span>' : ''}
                        ${hasTask && isToday ? '<span class="w-1 h-1 bg-white rounded-full mt-1"></span>' : ''}
                    </div>
                `;
            }
            html += '</div>';
            if (container) container.innerHTML = html;
        },

        getTasksForDate(dateStr) {
            const tasks = this.state.tasks.filter(t => t.dueDate === dateStr);
            if (tasks.length === 0) return 'No tasks';
            return tasks.map(t => `- ${t.title}`).join('\n');
        },

        changeMonth(delta) {
            this.currentDate.setMonth(this.currentDate.getMonth() + delta);
            this.renderCalendar();
        },

        openCalendarSettingsModal() {
            const modal = document.getElementById('modal-calendar-settings');
            const checkbox = modal.querySelector('input[name="startOnMonday"]');
            if (checkbox) checkbox.checked = this.state.calendarStartMonday;

            document.getElementById('modal-overlay').classList.remove('hidden');
            modal.classList.remove('hidden');
        },

        handleSaveCalendarSettings(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.state.calendarStartMonday = formData.get('startOnMonday') === 'on';
            this.save();
            this.closeModals();
        },

        openDayTasksModal(dateStr) {
            this.selectedDate = dateStr;
            const tasks = this.state.tasks.filter(t => t.dueDate === dateStr);

            // Fix date display to avoid timezone issues
            const [y, m, d] = dateStr.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);

            document.getElementById('day-tasks-title').innerText = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            document.getElementById('day-tasks-subtitle').innerText = `${tasks.length} Event${tasks.length !== 1 ? 's' : ''}`;

            const list = document.getElementById('day-tasks-list');
            if (tasks.length === 0) {
                list.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">No tasks planned for this day.</div>';
            } else {
                list.innerHTML = tasks.map(task => `
                    <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 group">
                        <div class="size-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-primary'}"></div>
                        <div class="flex-1 cursor-pointer hover:text-primary transition-colors" onclick="app.editTask(${task.id})">
                            <div class="flex justify-between items-start">
                                <p class="text-sm font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}">${task.title}</p>
                                ${task.time ? `<span class="text-[10px] bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 font-mono">${task.time}</span>` : ''}
                            </div>
                            <div class="flex flex-wrap gap-2 items-center mt-0.5">
                                <p class="text-[10px] text-slate-500 uppercase">${task.category}</p>
                                ${task.priority === 'high' ? '<span class="text-[10px] text-red-500 font-bold uppercase">High Priority</span>' : ''}
                                ${task.location ? `<span class="text-[10px] text-slate-400 flex items-center gap-0.5" title="${task.location}"><span class="material-symbols-outlined text-[10px]">location_on</span>${task.location.substring(0, 15)}${task.location.length > 15 ? '...' : ''}</span>` : ''}
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="event.stopPropagation(); app.editTask(${task.id})" class="p-2 text-slate-400 hover:text-primary transition-colors" title="Edit">
                                <span class="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button onclick="event.stopPropagation(); app.deleteTask(${task.id})" class="p-2 text-slate-400 hover:text-primary transition-colors" title="Delete">
                                <span class="material-symbols-outlined text-lg">delete</span>
                            </button>
                            <button onclick="event.stopPropagation(); app.toggleTask(${task.id}); setTimeout(() => app.openDayTasksModal('${dateStr}'), 50)" class="p-2 text-slate-400 hover:text-primary" title="${task.completed ? 'Undo' : 'Complete'}">
                                <span class="material-symbols-outlined text-lg">${task.completed ? 'undo' : 'check'}</span>
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            document.getElementById('modal-overlay').classList.remove('hidden');
            document.getElementById('modal-day-tasks').classList.remove('hidden');
            document.getElementById('modal-add-task').classList.add('hidden');
            document.getElementById('modal-edit-profile').classList.add('hidden');
        },

        timelineTemplates: [
            { title: 'Book Venue', category: 'venue', monthsBefore: 12 },
            { title: 'Hire Wedding Planner', category: 'vendors', monthsBefore: 12 },
            { title: 'Draft Guest List', category: 'general', monthsBefore: 11 },
            { title: 'Book Photographer', category: 'vendors', monthsBefore: 10 },
            { title: 'Book Officiant', category: 'vendors', monthsBefore: 9 },
            { title: 'Buy Wedding Dress', category: 'attire', monthsBefore: 9 },
            { title: 'Book Florist', category: 'vendors', monthsBefore: 8 },
            { title: 'Book DJ/Band', category: 'vendors', monthsBefore: 8 },
            { title: 'Send Save the Dates', category: 'general', monthsBefore: 6 },
            { title: 'Order Wedding Cake', category: 'general', monthsBefore: 5 },
            { title: 'Buy Wedding Rings', category: 'attire', monthsBefore: 4 },
            { title: 'Send Invitations', category: 'general', monthsBefore: 3 },
            { title: 'Final Dress Fitting', category: 'attire', monthsBefore: 1 },
            { title: 'Apply for Marriage License', category: 'general', monthsBefore: 1 }
        ],

        recalculateTimeline(interactive = false) {
            if (!this.state.profile.date) {
                if (interactive) alert('Please set a wedding date in Profile first.');
                return;
            }

            const weddingDate = new Date(this.state.profile.date);
            if (isNaN(weddingDate.getTime())) return;

            if (interactive && !confirm(`Auto-generate timeline based on ${this.state.profile.date}? This will add missing standard tasks and adjust dates of existing ones.`)) {
                return;
            }

            let addedCount = 0;
            let updatedCount = 0;

            this.timelineTemplates.forEach(template => {
                // Calculate Target Date
                const targetDate = new Date(weddingDate);
                targetDate.setMonth(targetDate.getMonth() - template.monthsBefore);
                const dateStr = targetDate.toISOString().split('T')[0];

                // Find existing task (case insensitive)
                const existingTask = this.state.tasks.find(t => t.title.toLowerCase() === template.title.toLowerCase());

                if (existingTask) {
                    if (existingTask.dueDate !== dateStr) {
                        existingTask.dueDate = dateStr;
                        updatedCount++;
                    }
                } else {
                    // Add new task
                    this.state.tasks.push({
                        id: Date.now() + Math.random(),
                        title: template.title,
                        category: template.category,
                        dueDate: dateStr,
                        completed: false
                    });
                    addedCount++;
                }
            });

            // Sort tasks by date
            this.state.tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            this.save();
            // this.render(); // save() calls render()

            if (interactive || addedCount > 0 || updatedCount > 0) {
                alert(`Timeline Updated!\n- ${addedCount} new tasks added\n- ${updatedCount} dates adjusted`);
            }

            return { added: addedCount, updated: updatedCount };
        }
    });
}

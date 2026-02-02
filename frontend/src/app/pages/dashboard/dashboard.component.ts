import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HabitService } from '../../services/habit.service';
import { Habit, HabitStats } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard">
      <header>
        <h1>🎯 Habit Pulse</h1>
        <div class="user-info">
          <span>{{ user?.firstName }}</span>
          <button (click)="logout()" class="logout-btn">Logout</button>
        </div>
      </header>

      <div class="container">
        <!-- Add Habit Section -->
        <div class="card add-habit-card">
          <h2>➕ Add New Habit</h2>
          <form (ngSubmit)="addHabit()">
            <input
              type="text"
              [(ngModel)]="newHabitName"
              name="habitName"
              placeholder="Enter habit name..."
              required
            />
            <button type="submit" [disabled]="!newHabitName || loading">
              Add Habit
            </button>
          </form>
          <div class="error" *ngIf="error">{{ error }}</div>
        </div>

        <!-- Habits List -->
        <div class="card habits-card">
          <h2>📋 Your Habits</h2>
          <div class="habits-list" *ngIf="habits.length > 0; else noHabits">
            <div class="habit-item" *ngFor="let habit of habits">
              <div class="habit-info">
                <h3>{{ habit.name }}</h3>
                <span class="status" [class.enabled]="habit.enabled">
                  {{ habit.enabled ? '✅ Enabled' : '❌ Disabled' }}
                </span>
              </div>
              <div class="habit-actions">
                <button (click)="logHabit(habit)" class="log-btn" [disabled]="loading">
                  Log Today
                </button>
                <button (click)="toggleHabit(habit)" class="toggle-btn">
                  {{ habit.enabled ? 'Disable' : 'Enable' }}
                </button>
                <button (click)="deleteHabit(habit)" class="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          </div>
          <ng-template #noHabits>
            <p class="no-data">No habits yet. Add one above to get started!</p>
          </ng-template>
        </div>

        <!-- Statistics -->
        <div class="card stats-card">
          <h2>📊 Statistics</h2>
          <div class="stats-list" *ngIf="stats.length > 0; else noStats">
            <div class="stat-item" *ngFor="let stat of stats">
              <div class="stat-name">
                {{ stat.habitName }}
                <span [class.enabled]="stat.enabled">
                  {{ stat.enabled ? '✅' : '❌' }}
                </span>
              </div>
              <div class="stat-value">{{ stat.totalLogs }} logs</div>
            </div>
          </div>
          <ng-template #noStats>
            <p class="no-data">No statistics yet.</p>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f5f5f5;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    header h1 {
      margin: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .logout-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .container {
      max-width: 1200px;
      margin: 30px auto;
      padding: 0 20px;
      display: grid;
      gap: 20px;
      grid-template-columns: 1fr 1fr;
    }

    .card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .add-habit-card {
      grid-column: 1 / -1;
    }

    h2 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #333;
    }

    form {
      display: flex;
      gap: 10px;
    }

    input[type="text"] {
      flex: 1;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 16px;
    }

    input[type="text"]:focus {
      outline: none;
      border-color: #667eea;
    }

    button {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    button[type="submit"] {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error {
      margin-top: 10px;
      padding: 10px;
      background: #fee;
      color: #c33;
      border-radius: 6px;
    }

    .habits-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .habit-item {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: border-color 0.3s;
    }

    .habit-item:hover {
      border-color: #667eea;
    }

    .habit-info h3 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .status {
      font-size: 14px;
      color: #999;
    }

    .status.enabled {
      color: #4caf50;
    }

    .habit-actions {
      display: flex;
      gap: 8px;
    }

    .log-btn {
      background: #4caf50;
      color: white;
      padding: 8px 16px;
      font-size: 14px;
    }

    .toggle-btn {
      background: #ff9800;
      color: white;
      padding: 8px 16px;
      font-size: 14px;
    }

    .delete-btn {
      background: #f44336;
      color: white;
      padding: 8px 16px;
      font-size: 14px;
    }

    .stats-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 6px;
    }

    .stat-name {
      font-weight: 500;
      color: #333;
    }

    .stat-value {
      color: #667eea;
      font-weight: 600;
    }

    .no-data {
      text-align: center;
      color: #999;
      padding: 20px;
    }

    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
      }

      .habit-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .habit-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .habit-actions button {
        flex: 1;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  user: any;
  habits: Habit[] = [];
  stats: HabitStats[] = [];
  newHabitName = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private habitService: HabitService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadHabits();
    this.loadStats();
  }

  loadHabits() {
    this.habitService.getHabits(this.user.userId).subscribe({
      next: (habits) => {
        this.habits = habits;
      },
      error: (err) => {
        console.error('Failed to load habits:', err);
      },
    });
  }

  loadStats() {
    this.habitService.getUserStats(this.user.userId).subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
      },
    });
  }

  addHabit() {
    if (!this.newHabitName.trim()) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.habitService.createHabit(this.user.userId, this.newHabitName.trim()).subscribe({
      next: () => {
        this.newHabitName = '';
        this.loadHabits();
        this.loadStats();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to create habit';
        this.loading = false;
      },
    });
  }

  logHabit(habit: Habit) {
    this.loading = true;
    this.error = '';

    this.habitService.logHabit(this.user.userId, habit._id).subscribe({
      next: () => {
        alert(`✅ Logged "${habit.name}" successfully!`);
        this.loadStats();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to log habit';
        if (err.status === 409) {
          alert('Already logged today!');
        }
        this.loading = false;
      },
    });
  }

  toggleHabit(habit: Habit) {
    this.habitService.updateHabit(habit._id, { enabled: !habit.enabled }).subscribe({
      next: () => {
        this.loadHabits();
        this.loadStats();
      },
      error: (err) => {
        console.error('Failed to toggle habit:', err);
      },
    });
  }

  deleteHabit(habit: Habit) {
    if (!confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      return;
    }

    this.habitService.deleteHabit(habit._id).subscribe({
      next: () => {
        this.loadHabits();
        this.loadStats();
      },
      error: (err) => {
        console.error('Failed to delete habit:', err);
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>🎯 Habit Pulse</h1>
        <p>Enter your Telegram ID to continue</p>
        
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="telegramId">Telegram ID</label>
            <input
              type="number"
              id="telegramId"
              [(ngModel)]="telegramId"
              name="telegramId"
              placeholder="123456789"
              required
            />
          </div>

          <button type="submit" [disabled]="loading">
            {{ loading ? 'Verifying...' : 'Login' }}
          </button>
        </form>

        <div class="error" *ngIf="error">{{ error }}</div>

        <div class="help-text">
          <p>To find your Telegram ID:</p>
          <ol>
            <li>Open Telegram and search for <strong>@userinfobot</strong></li>
            <li>Start a chat and it will show your ID</li>
            <li>Make sure you've started the bot first with /start</li>
          </ol>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 100%;
    }

    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
    }

    p {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #667eea;
    }

    button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }

    button:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error {
      margin-top: 15px;
      padding: 12px;
      background: #fee;
      color: #c33;
      border-radius: 6px;
      text-align: center;
    }

    .help-text {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 14px;
      color: #666;
    }

    .help-text strong {
      color: #667eea;
    }

    ol {
      margin: 10px 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 5px;
    }
  `],
})
export class LoginComponent implements OnInit {
  telegramId: number | null = null;
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit() {
    if (!this.telegramId) {
      this.error = 'Please enter your Telegram ID';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.verifyTelegramId(this.telegramId).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to verify Telegram ID. Make sure you\'ve started the bot first.';
        this.loading = false;
      },
    });
  }
}

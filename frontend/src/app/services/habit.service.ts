import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Habit } from '../models';

@Injectable({
  providedIn: 'root',
})
export class HabitService {
  constructor(private http: HttpClient) {}

  getHabits(userId: string): Observable<Habit[]> {
    return this.http.get<Habit[]>(`${environment.apiUrl}/habits?userId=${userId}`);
  }

  createHabit(userId: string, name: string): Observable<Habit> {
    return this.http.post<Habit>(`${environment.apiUrl}/habits`, { userId, name });
  }

  updateHabit(id: string, updates: Partial<Habit>): Observable<Habit> {
    return this.http.put<Habit>(`${environment.apiUrl}/habits/${id}`, updates);
  }

  deleteHabit(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/habits/${id}`);
  }

  logHabit(userId: string, habitId: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/logs`, { userId, habitId });
  }

  getHabitLogs(habitId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/logs/${habitId}`);
  }

  getUserStats(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/stats/user/${userId}`);
  }
}

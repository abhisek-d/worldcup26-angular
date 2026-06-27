import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TeamSelectionService {
  players: any[] = [];
  fixtureId: number | null = null;

  set(players: any[], fixtureId: number | null): void {
    this.players = players;
    this.fixtureId = fixtureId;
  }

  clear(): void {
    this.players = [];
    this.fixtureId = null;
  }
}
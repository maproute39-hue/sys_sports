// src/app/services/groups.service.ts

import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';

export interface Group {
  id: string;
  collectionId?: string;
  collectionName?: string;
  name: string;
  category_id?: string;
  id_group?: string;
  created?: string;
  updated?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private pb = new PocketBase('https://db.buckapi.site:8030');

  async getGroups(): Promise<Group[]> {
    return await this.pb.collection('groups').getFullList<Group>({
      sort: '-created',
    });
  }

  async getGroupById(id: string): Promise<Group> {
    return await this.pb.collection('groups').getOne<Group>(id);
  }

  async createGroup(data: Partial<Group>): Promise<Group> {
    return await this.pb.collection('groups').create<Group>(data);
  }

  async updateGroup(id: string, data: Partial<Group>): Promise<Group> {
    return await this.pb.collection('groups').update<Group>(id, data);
  }

  async deleteGroup(id: string): Promise<boolean> {
    await this.pb.collection('groups').delete(id);
    return true;
  }
}
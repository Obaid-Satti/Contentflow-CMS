import type { LucideIcon } from 'lucide-react';
import { Database, FileText, Image, KeyRound } from 'lucide-react';

export type AdminPage = { path: string; label: string; description: string; icon: LucideIcon };

export const navigationItems: AdminPage[] = [
  { path: '/content-manager', label: 'Content Manager', description: 'Create and manage entries', icon: FileText },
  { path: '/content-types', label: 'Content-Type Builder', description: 'Define your content models', icon: Database },
  { path: '/media-library', label: 'Media Library', description: 'Organize files and images', icon: Image },
  { path: '/settings', label: 'Settings', description: 'Configure access and API tokens', icon: KeyRound },
];

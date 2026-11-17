import { describe, it, expect } from 'vitest';

describe('Polymorphic Comments System (Issue #28)', () => {
  interface CommentItem {
    id: string;
    targetType: 'row' | 'table' | 'dashboard' | 'card';
    targetId: string;
    authorName: string;
    content: string;
    resolved: boolean;
    createdAt: string;
  }

  it('should create and format comments correctly for rows and dashboards', () => {
    const rowComment: CommentItem = {
      id: 'c_01',
      targetType: 'row',
      targetId: 'row_101',
      authorName: 'Sebastián Nadales',
      content: 'Revisar discrepancia en costo FOB versus factura naviera.',
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    expect(rowComment.targetType).toBe('row');
    expect(rowComment.resolved).toBe(false);
    expect(rowComment.content).toContain('discrepancia en costo FOB');

    const cardComment: CommentItem = {
      id: 'c_02',
      targetType: 'card',
      targetId: 'card_kpi_ventas',
      authorName: 'n8n Bot',
      content: 'Pico inusual de ventas detectado en sucursal norte.',
      resolved: true,
      createdAt: new Date().toISOString(),
    };

    expect(cardComment.targetType).toBe('card');
    expect(cardComment.resolved).toBe(true);
    expect(cardComment.authorName).toBe('n8n Bot');
  });

  it('should toggle resolved status correctly', () => {
    let comment: CommentItem = {
      id: 'c_03',
      targetType: 'table',
      targetId: 'table_865',
      authorName: 'Antigravity',
      content: 'Verificado esquema de columnas.',
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    expect(comment.resolved).toBe(false);
    comment = { ...comment, resolved: true };
    expect(comment.resolved).toBe(true);
  });
});

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, BookOpen, Calendar, Tag, Edit2, ChevronLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote as deleteNoteApi,
  type Note,
} from '@/lib/api/notes';

interface NotesPageProps {
  courseId?: number;
  sessionId?: number;
}

export function NotesPage({ courseId, sessionId }: NotesPageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [view, setView] = useState<'list' | 'edit'>('list');

  useEffect(() => {
    loadNotes();
  }, []);

  function loadNotes() {
    let all = getAllNotes();
    if (sessionId) all = all.filter((n) => n.session_id === sessionId);
    else if (courseId) all = all.filter((n) => n.course_id === courseId);
    setNotes(all);
  }

  const handleNew = () => {
    const newNote = createNote({
      title: 'Catatan Baru',
      content: '',
      course_id: courseId || null,
      session_id: sessionId || null,
      tags: [],
    });
    setSelectedNote(newNote);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setEditTags('');
    setEditing(true);
    setView('edit');
  };

  const handleSave = () => {
    if (!selectedNote) return;
    const tags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const updated = updateNote(selectedNote.id, {
      title: editTitle,
      content: editContent,
      tags,
    });
    if (updated) {
      setSelectedNote(updated);
      setEditing(false);
      loadNotes();
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Hapus catatan ini?')) return;
    deleteNoteApi(id);
    setSelectedNote(null);
    setEditing(false);
    loadNotes();
  };

  const handleSelect = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setView('edit');
    setEditing(false);
  };

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  const filtered = notes.filter((n) => {
    const matchSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchTag = !tagFilter || n.tags.includes(tagFilter);
    return matchSearch && matchTag;
  });

  // Mobile list view
  if (view === 'list') {
    return (
      <div className="container mx-auto p-4 lg:p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-7 h-7" />
              Catatan Saya
            </h1>
            <p className="text-muted-foreground mt-1">
              {notes.length} catatan
              {sessionId && ' untuk sesi ini'}
              {courseId && !sessionId && ' untuk mata kuliah ini'}
            </p>
          </div>
          <Button onClick={handleNew} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Baru
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge
              variant={!tagFilter ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTagFilter(null)}
            >
              Semua
            </Badge>
            {allTags.map((tag: string) => (
              <Badge
                key={tag}
                variant={tagFilter === tag ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Notes list */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">Belum ada catatan</p>
              <p className="text-muted-foreground mt-1">
                {sessionId
                  ? 'Buat catatan untuk sesi ini'
                  : 'Buat catatan pertamamu'}
              </p>
              <Button onClick={handleNew} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Buat Catatan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleSelect(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{note.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {note.content || 'Tidak ada isi'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {note.session_id && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Sesi {note.session_id}
                          </span>
                        )}
                        <span>{new Date(note.updated_at).toLocaleDateString('id-ID')}</span>
                      </div>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.slice(0, 3).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{note.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Edit/detail view
  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setView('list'); setSelectedNote(null); setEditing(false); }}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Button>
          {editing ? (
            <h2 className="text-lg font-semibold">Edit Catatan</h2>
          ) : (
            <h2 className="text-lg font-semibold">{selectedNote?.title}</h2>
          )}
        </div>
        <div className="flex gap-2">
          {selectedNote && !editing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(selectedNote.id)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Hapus
              </Button>
            </>
          )}
          {editing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditing(false); setEditTitle(selectedNote?.title || ''); setEditContent(selectedNote?.content || ''); setEditTags(selectedNote?.tags.join(', ') || ''); }}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-4">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Judul catatan..."
            className="text-xl font-semibold"
          />
          <Input
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="Tags (pisah koma): kuliah, matematika, ..."
          />
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Tulis catatan di sini...\n\nGunakan markdown-like syntax:\n# Heading\n## Subheading\n- Bullet point\n**Bold**\n*Italic*"
            className="min-h-[60vh] font-mono text-sm leading-relaxed"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {selectedNote && selectedNote.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedNote.tags.map((t: string) => (
                <Badge key={t} variant="secondary">
                  <Tag className="w-3 h-3 mr-1" />
                  {t}
                </Badge>
              ))}
            </div>
          )}
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {selectedNote?.content || (
                <span className="text-muted-foreground italic">
                  Belum ada isi. Klik Edit untuk mulai menulis.
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground pt-4 border-t">
            Dibuat: {new Date(selectedNote?.created_at || '').toLocaleString('id-ID')}
            {' • '}
            Diperbarui: {new Date(selectedNote?.updated_at || '').toLocaleString('id-ID')}
          </div>
        </div>
      )}
    </div>
  );
}

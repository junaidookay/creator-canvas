import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadFile, validateFile, ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES, MAX_VIDEO_SIZE, MAX_IMAGE_SIZE } from '@/lib/storage';
import { VIDEO_CATEGORIES } from '@/types/database';
import { Upload as UploadIcon, Film, Image, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-4">You need to be logged in to upload videos.</p>
          <Button onClick={() => navigate('/login')}>Sign in</Button>
        </div>
      </div>
    );
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, ALLOWED_VIDEO_TYPES, MAX_VIDEO_SIZE);
    if (err) { setError(err); return; }
    setVideoFile(file);
    setError('');
  };

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
    if (err) { setError(err); return; }
    setThumbFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) { setError('Please select a video file'); return; }
    if (!title.trim()) { setError('Please enter a title'); return; }
    if (!category) { setError('Please select a category'); return; }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const videoResult = await uploadFile(videoFile, 'videos', 'videos', p => setProgress(Math.round(p * 0.7)));
      let thumbUrl = null;
      if (thumbFile) {
        const thumbResult = await uploadFile(thumbFile, 'thumbnails', 'thumbnails', p => setProgress(70 + Math.round(p * 0.2)));
        thumbUrl = thumbResult.url;
      }
      setProgress(90);

      const { error: dbError } = await supabase.from('videos').insert({
        title: title.trim(),
        description: description.trim() || null,
        thumbnail_url: thumbUrl,
        video_url: videoResult.url,
        video_path: videoResult.path,
        storage_type: videoResult.provider,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        creator_id: user.id,
        views: 0,
      });

      if (dbError) throw dbError;
      setProgress(100);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Video uploaded!</h1>
          <p className="text-muted-foreground mb-4">Your video is now live on VSTREAM.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => { setSuccess(false); setVideoFile(null); setThumbFile(null); setTitle(''); setDescription(''); setCategory(''); setTags(''); }}>Upload another</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Go home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Upload Video</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div onClick={() => videoRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors">
            <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoSelect} className="hidden" />
            {videoFile ? (
              <div className="flex items-center gap-3 justify-center">
                <Film className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{videoFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <UploadIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground font-medium">Click to select video</p>
                <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV • Max 500MB</p>
              </>
            )}
          </div>

          <div onClick={() => thumbRef.current?.click()} className="border border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 transition-colors">
            <input ref={thumbRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleThumbSelect} className="hidden" />
            {thumbFile ? (
              <div className="flex items-center gap-3 justify-center">
                <Image className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">{thumbFile.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center text-muted-foreground">
                <Image className="w-5 h-5" />
                <span className="text-sm">Add thumbnail (optional)</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Give your video a title" maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your video..." rows={4} maxLength={5000} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {VIDEO_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2, tag3" />
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">{progress}% uploaded</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><UploadIcon className="w-4 h-4 mr-2" /> Upload Video</>}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Upload;

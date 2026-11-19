import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export interface VideoCardProps {
  id: string;
  title: string;
  thumbnail?: string | null;
  creator: string;
  views: string;
  date: string;
  category?: string;
  gradient?: string;
}

const VideoCard = ({ id, title, thumbnail, creator, date, category, gradient }: VideoCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
  >
    <Link to={`/watch/${id}`} className="group block">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary mb-3">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full" style={{ background: gradient || 'linear-gradient(135deg, hsl(187 85% 53% / 0.3), hsl(225 25% 15%))' }} />
        )}
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-300" />
        {category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/80 text-primary-foreground">
            {category}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground mb-1">{creator}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {date}</span>
      </div>
    </Link>
  </motion.div>
);

export default VideoCard;

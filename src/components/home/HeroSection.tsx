import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Sparkles } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-[85vh] min-h-[500px] flex items-center overflow-hidden">
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" /> The future of independent streaming
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4">
            Your content.{' '}
            <span className="text-gradient-primary">Your platform.</span>
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-lg">
            Upload, share, and monetize your videos on a premium streaming network built for creators.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/signup')} className="glow-primary">
              <Play className="w-4 h-4 mr-2" /> Start Creating
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/feed')}>
              Explore Content
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

interface AdSlotProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

const AdSlot = ({ slot, format = 'auto', className = '' }: AdSlotProps) => {
  const pubId = localStorage.getItem('joulecorp_adsense_pub_id');

  if (!pubId) return null;

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={pubId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSlot;

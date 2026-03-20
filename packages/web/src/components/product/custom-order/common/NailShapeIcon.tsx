import { NailShape } from '@handy-platform/shared';

interface NailShapeIconProps {
  shape: NailShape;
  className?: string;
  selected?: boolean;
}

const SHAPE_IMAGES: Record<NailShape, string> = {
  ROUND: '/images/nail-shapes/round.png',
  ALMOND: '/images/nail-shapes/almond.png',
  SQUARE: '/images/nail-shapes/square.png',
  OVAL: '/images/nail-shapes/oval.png',
  COFFIN: '/images/nail-shapes/coffin.png',
  STILETTO: '/images/nail-shapes/stiletto.png',
};

export function NailShapeIcon({ shape, className = '', selected = false }: NailShapeIconProps) {
  return (
    <img
      src={SHAPE_IMAGES[shape]}
      alt={shape}
      className={`w-12 h-16 object-contain ${selected ? 'brightness-0 invert' : ''} ${className}`}
    />
  );
}

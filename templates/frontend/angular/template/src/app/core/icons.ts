import {
  heroCheckCircleSolid,
  heroCheckSolid,
  heroChevronDownSolid,
  heroChevronRightSolid,
  heroDocumentTextSolid,
  heroExclamationTriangleSolid,
  heroMagnifyingGlassSolid,
  heroMoonSolid,
  heroSquares2x2Solid,
  heroSunSolid,
  heroSwatchSolid,
  heroUsersSolid,
  heroViewColumnsSolid,
  heroXCircleSolid,
  heroXMarkSolid,
} from '@ng-icons/heroicons/solid';

// The Heroicons this app uses, registered once in app.config.ts. To use another one, import it from
// '@ng-icons/heroicons/solid' (or /outline, /mini, /micro) and add it here, then show it with
// <ng-icon name="heroNameOfTheIcon" />.
export const APP_ICONS = {
  heroCheckCircleSolid,
  heroCheckSolid,
  heroChevronDownSolid,
  heroChevronRightSolid,
  heroDocumentTextSolid,
  heroExclamationTriangleSolid,
  heroMagnifyingGlassSolid,
  heroMoonSolid,
  heroSquares2x2Solid,
  heroSunSolid,
  heroSwatchSolid,
  heroUsersSolid,
  heroViewColumnsSolid,
  heroXCircleSolid,
  heroXMarkSolid,
};

export type AppIconName = keyof typeof APP_ICONS;

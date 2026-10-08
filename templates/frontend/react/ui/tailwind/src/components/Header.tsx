import seal from '../assets/hhs-seal.png';
import { APP_NAME } from '../lib/config';
import { Avatar } from './Avatar';
import { SearchField } from './SearchField';

// The search field and the avatar are for show: nothing is searched and nobody is signed in until you add it.
export function Header(): React.JSX.Element {
  return (
    <header className="glass flex min-h-[var(--header-height)] shrink-0 items-center gap-4 rounded-md px-4 py-3 sm:px-6">
      <img src={seal} alt="" className="size-10" />
      <span className="font-title text-h2 text-text">{APP_NAME}</span>
      <div className="ml-auto flex items-center gap-4">
        <SearchField className="hidden w-72 md:flex lg:w-[28rem]" />
        <Avatar name="User" size="sm" />
      </div>
    </header>
  );
}

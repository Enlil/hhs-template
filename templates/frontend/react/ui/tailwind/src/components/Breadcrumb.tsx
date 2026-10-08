import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  /** Leave out for the page you are on, which is the last item. */
  to?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }): React.JSX.Element {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-content-3 text-muted">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 ? <ChevronRightIcon className="size-3" aria-hidden="true" /> : null}
            {item.to ? (
              <Link to={item.to} className="hover:text-primary-vivid hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

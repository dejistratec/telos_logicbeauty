export interface ServiceItem {
  id: string;
  title: string;
  titleJp: string; // Japanese title displayed below English title
  subtitle: string; // Headline (e.g. Media Strategy)
  concept: string;
  description: string;
  workflow: string[];
  priceLabel: string; // For Index page display
  pricingDetails: {
    initial?: {
      price: string;
      description: string;
    };
    monthly?: {
      price: string;
      description: string;
    };
    recommended?: {
      price: string;
      details: string[];
      note?: string;
    };
    menu?: {
      category: string;
      items: { label: string; price: string }[];
    }[];
  };
}

export interface WorkItem {
  id: string;
  client: string;
  category: string;
  scope: string[];
  description: string;
  highlights: string;
  evidence: {
    label: string;
    value: string;
  }[];
  outcome: string; // Narrative result
}

export enum RoutePath {
  HOME = '/',
  ABOUT = '/about',
  SERVICE = '/service',
  SERVICE_DETAIL = '/service/:id',
  WORKS = '/works',
  CONTACT = '/contact'
}
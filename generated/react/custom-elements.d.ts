import type * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "carousel-dots": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "combo-box": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "combobox-empty": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "control-bar": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "item-group": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "panel-content": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "panel-footer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "panel-header": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "popover-panel": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "tab-list": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "tab-panel": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "ui-carousel": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "ui-item": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "ui-tabs": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};

import type { MantuCheckoutResponse } from "../types";

export interface MantuCheckoutOptions {
  key: string;
  order_id: string;
  amount: number;                          
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: MantuCheckoutResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

   
                              
  
         
        
                                    
                             
                                    
                                
                              
                        
                                   
                                   
                                 
                                  
      
      
                
      
   
export class MantuCheckout {
  private options: MantuCheckoutOptions;
  private onOpenCallback?: (options: MantuCheckoutOptions) => void;

  constructor(options: MantuCheckoutOptions) {
    this.options = options;
  }

  public setOpenHandler(cb: (options: MantuCheckoutOptions) => void) {
    this.onOpenCallback = cb;
  }

  public open() {
    if (this.onOpenCallback) {
      this.onOpenCallback(this.options);
    }
  }
}

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Org {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  industry: string | null;
  size: string | null;
  plan: string | null;
}

interface OrgContextValue {
  orgs: Org[];
  currentOrg: Org | null;
  orgId: string | null;
  isLoading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
}

const OrgContext = createContext<OrgContextValue>({
  orgs: [],
  currentOrg: null,
  orgId: null,
  isLoading: true,
  switchOrg: async () => {},
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('org_id')
      .eq('user_id', user.id);

    if (!roles || roles.length === 0) {
      setIsLoading(false);
      return;
    }

    const orgIds = roles.map(r => r.org_id);
    const { data: orgsData } = await supabase
      .from('orgs')
      .select('*')
      .in('id', orgIds);

    if (orgsData) {
      setOrgs(orgsData as Org[]);
      if (!currentOrg && orgsData.length > 0) {
        setCurrentOrg(orgsData[0] as Org);
      }
    }
    setIsLoading(false);
  }, [currentOrg]);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const switchOrg = useCallback(async (orgId: string) => {
    const org = orgs.find(o => o.id === orgId);
    if (org) {
      setCurrentOrg(org);
    }
  }, [orgs]);

  return (
    <OrgContext.Provider value={{ orgs, currentOrg, orgId: currentOrg?.id ?? null, isLoading, switchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}

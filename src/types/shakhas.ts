export type Shakha = {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
};

/**
 * Extended Shakha type used for list responses with computed member aggregate
 */
export type ShakhaWithMemberCount = Shakha & {
  memberCount: number;
};

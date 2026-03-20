export type Shakha = {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
};

export const MOCK_SHAKHAS: Shakha[] = Array.from({ length: 100 }, (_, i) => {
  const id = (i + 1).toString();

  // Real names for the first few, then generic names for the rest
  const names = [
    'Salalah City',
    'Awqad',
    'Dahariz',
    'Saada',
    'Raysut',
    'Al Wadi',
    'Al Baleed',
    'Mirbat',
    'Taqah',
  ];
  const name = names[i] || `Shakha Branch ${id}`;

  return {
    id,
    name,
    created_at: new Date(Date.now() - i * 3600000), // Staggered times (1 hour apart)
    updated_at: new Date(),
  };
});

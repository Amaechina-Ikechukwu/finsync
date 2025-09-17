declare module 'naija-state-local-government' {
  const NaijaStates: {
    all: () => any;
    states: () => string[];
    lgas: (state: string) => string[];
  };
  export default NaijaStates;
}

import { AppsInToss, OverlayProvider } from '@apps-in-toss/framework';
import type { InitialProps } from '@granite-js/react-native';
import type { PropsWithChildren } from 'react';
import { enableScreens } from 'react-native-screens';
import { context } from '../require.context';

enableScreens(true);

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return <OverlayProvider>{children}</OverlayProvider>;
}

export default AppsInToss.registerApp(AppContainer, { context });

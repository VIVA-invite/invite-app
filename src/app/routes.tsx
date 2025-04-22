import App from './root';
import Index from './routes/index';
import Invitee from './routes/invitee';
import Location from './routes/location';
import DateTime from './routes/dateTime';
import Activity from './routes/activity';
import PartyType from './routes/partyType';
import Theme from './routes/theme';
import { InvitationProvider } from './utils/invitationContext';

const routes = [
  {
    path: '/',
    element: (
      <InvitationProvider>
        <App />
      </InvitationProvider>
    ),
    children: [
      { index: true, element: <Index /> },
      { path: 'invitee', element: <Invitee /> },
      { path: 'location', element: <Location /> },
      { path: 'dateTime', element: <DateTime /> },
      { path: 'activity', element: <Activity /> },
      { path: 'partyType', element: <PartyType /> },
      { path: 'theme', element: <Theme /> },
    ],
  },
];

export default routes;
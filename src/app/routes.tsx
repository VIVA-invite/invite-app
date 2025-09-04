/**
 * Routing for all the pages
 */
import App from './root';
import Index from './routes/index';
import Invitee from './routes/invitee';
import Location from './routes/location';
import DateTime from './routes/dateTime';
import Activity from './routes/activity';
import PartyType from './routes/partyType';
import Theme from './routes/theme';
import Confirmation from './routes/confirmation'
import Guest from './routes/guest'
import { InvitationProvider } from './utils/invitationContext';
import Event from './routes/events';
import DashboardRoute from './routes/dashboard';


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
      { path: 'confirmation', element: <Confirmation /> },
      { path: 'guest/:inviteId', element: <Guest /> },
      { path: "/event",element: <Event />},
      { path: "/dashboard",element: <DashboardRoute />},
    ]
  },
];

export default routes;
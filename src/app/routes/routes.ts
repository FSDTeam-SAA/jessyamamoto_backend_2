import { Router } from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { serviceRouter } from '../modules/service/service.routes';
import { categoryRouter } from '../modules/category/category.routes';
import { subscriptionRouter } from '../modules/subscription/subscription.routes';
import { reviewRouter } from '../modules/review/review.routes';
import { messageRoutes } from '../modules/message/message.routes';
import { conversationRoutes } from '../modules/conversation/conversation.routes';

const router = Router();

const moduleRoutes = [
  {
    path: '/user',
    route: userRoutes,
  },
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/service',
    route: serviceRouter,
  },
  {
    path: '/category',
    route: categoryRouter,
  },
  {
    path: '/subscription',
    route: subscriptionRouter,
  },
  {
    path: '/review',
    route: reviewRouter,
  },
  {
    path: '/message',
    route: messageRoutes,
  },
  {
    path: '/conversation',
    route: conversationRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

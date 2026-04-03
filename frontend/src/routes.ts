export const Routes = {
  Home: '/',
  Post: (slug: string) => `/post/${slug}`,
  Tag: (id: string | number) => `/tag/${id}`,
  Login: '/auth/login',
  Register: '/auth/register',
  Profile: '/profile',
  Admin: '/admin',
  AdminPostNew: '/admin/posts/new',
  AdminPostEdit: (id: string | number) => `/admin/posts/${id}/edit`,
  AdminTags: '/admin/tags',
} as const

export type RouteKey = keyof typeof Routes
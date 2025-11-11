// JWT User payload
export interface JWTUser {
  sub: string
  name: string
  email: string
  iat?: number
  exp?: number
}

// Request body types
export interface CreateFolderBody {
  name: string
  color?: string
  parentId?: string
}

export interface UpdateFolderBody {
  name?: string
  color?: string
  parentId?: string | null
}

export interface MoveLessonBody {
  folderId: string | null
}

export interface CreateRoomBody {
  name: string
  description?: string
  folderId?: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface RegisterBody {
  name: string
  email: string
  password: string
}

// Request params types
export interface FolderParams {
  folderId: string
}

export interface RoomParams {
  roomId: string
}

export interface ActivityParams {
  activityId: string
}

// Helper to get typed user from request
export function getUserFromRequest(request: { user: any }): JWTUser {
  return request.user as JWTUser
}

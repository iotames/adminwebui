export interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  dept_id: number;
  dept_name: string;
  role: string;
  status: 0 | 1;
  created_at: string;
}

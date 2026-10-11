export type UserRole = 'MEMBER' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  airline?: string | null;
  aircraft_studied?: string[] | null;
  subjects_studied?: string[] | null;
  avatar_url?: string | null;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export type MaterialType =
  | 'Previous Exam'
  | 'Study Notes'
  | 'Question Bank'
  | 'PowerPoint'
  | 'Training Manual'
  | 'Procedure'
  | 'Study Guide'
  | 'Flashcards'
  | 'Other';

export type MaterialStatus = 'pending' | 'approved' | 'rejected';

export interface MaterialVersion {
  id: string;
  material_id: string;
  version_number: number;
  r2_key_original: string;
  r2_key_markdown?: string | null;
  r2_key_text?: string | null;
  filename: string;
  mime_type: string;
  size_bytes: number;
  extracted_markdown?: string | null;
  extracted_text?: string | null;
  processing_status: 'processing' | 'completed' | 'failed';
  uploader_id: string;
  created_at: string;
}

export interface Material {
  id: string;
  title: string;
  description?: string | null;
  material_type: MaterialType;
  subject: string;
  aircraft?: string | null;
  airline?: string | null;
  course?: string | null;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  year?: number | null;
  uploader_id: string;
  uploader_name?: string;
  current_version_id?: string | null;
  current_version?: MaterialVersion | null;
  status: MaterialStatus;
  rejection_reason?: string | null;
  views_count: number;
  downloads_count: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface Post {
  id: string;
  author_id: string;
  author_name?: string;
  author_role?: UserRole;
  title: string;
  content: string;
  tags?: string[];
  status: 'published' | 'hidden' | 'flagged';
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  attachments?: PostAttachment[];
}

export interface PostAttachment {
  id: string;
  post_id: string;
  material_id?: string | null;
  file_r2_key?: string | null;
  file_name?: string | null;
  file_mime_type?: string | null;
}

export type QuestionStatus = 'pending_review' | 'approved' | 'rejected';

export interface Question {
  id: string;
  question_bank_id?: string | null;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  aircraft?: string | null;
  subject?: string | null;
  source_material_id?: string | null;
  source_version_id?: string | null;
  source_page?: number | null;
  source_section?: string | null;
  ai_generated: boolean;
  status: QuestionStatus;
  created_at: string;
}

export interface QuestionBank {
  id: string;
  title: string;
  description?: string | null;
  aircraft?: string | null;
  subject?: string | null;
  created_by: string;
  created_at: string;
  question_count?: number;
}

export interface Exam {
  id: string;
  title: string;
  description?: string | null;
  aircraft?: string | null;
  subject?: string | null;
  difficulty?: string | null;
  total_questions: number;
  time_limit_minutes: number;
  passing_percentage: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  is_official: boolean;
  created_by: string;
  created_at: string;
}

export interface FrozenQuestionSnapshot {
  question_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
  difficulty: string;
  topic: string;
  source_material_id?: string | null;
  source_page?: number | null;
}

export interface ExamSession {
  id: string;
  exam_id?: string | null;
  user_id: string;
  exam_type: 'Practice' | 'Mock' | 'Previous' | 'AI Generated' | 'Weak Areas';
  status: 'in_progress' | 'completed' | 'expired';
  question_snapshots: FrozenQuestionSnapshot[];
  time_limit_minutes: number;
  passing_percentage: number;
  start_time: string;
  end_time?: string | null;
  score?: number | null;
  total_score?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  performance_analysis?: any | null;
}

export interface ExamAnswer {
  id: string;
  session_id: string;
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  time_spent_seconds: number;
  answered_at: string;
}

export interface Notification {
  id: string;
  target_type: 'all' | 'aircraft' | 'airline' | 'course' | 'subject' | 'user';
  target_value?: string | null;
  title: string;
  message: string;
  category: 'material' | 'exam' | 'announcement' | 'approval' | 'result' | 'recommendation' | 'system';
  link?: string | null;
  is_read?: boolean;
  created_at: string;
}

export interface NotificationPreference {
  user_id: string;
  notify_new_exams: boolean;
  notify_new_materials: boolean;
  notify_announcements: boolean;
  notify_recommended: boolean;
  notify_results: boolean;
}

export interface StudyPack {
  material: Material;
  version: MaterialVersion;
  extracted_text?: string | null;
  extracted_markdown?: string | null;
  extracted_questions: Question[];
  summary?: string | null;
  revision_notes?: string[] | null;
  practice_questions: Question[];
}

export interface CurriculumModule {
  id: string;
  title: string;
  description?: string;
  material_ids: string[];
  quiz_exam_id?: string | null;
  estimated_hours?: number;
}

export interface Curriculum {
  id: string;
  title: string;
  description?: string | null;
  aircraft?: string | null;
  airline?: string | null;
  category: string;
  estimated_duration: string;
  modules: CurriculumModule[];
  safety_final_exam_id?: string | null;
  service_final_exam_id?: string | null;
  school_final_exam_id?: string | null;
  has_safety_final: boolean;
  has_service_final: boolean;
  has_school_final: boolean;
  passing_percentage: number;
  is_published: boolean;
  created_by: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCurriculumProgress {
  id: string;
  user_id: string;
  curriculum_id: string;
  completed_material_ids: string[];
  completed_quiz_ids: string[];
  safety_final_score?: number | null;
  service_final_score?: number | null;
  school_final_score?: number | null;
  status: 'enrolled' | 'in_progress' | 'completed';
  graduated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  updated_at: string;
}

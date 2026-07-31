-- KAG Unity Church PWA - MySQL schema (matches backend/api/models*.py)
-- Regenerated to reflect the full current model set, including everything
-- added since the original version of this file (donations, department
-- admin assignments, department attendance, announcements, audit log,
-- OTP tables, children's ministry, and the Event/MemberProfile columns
-- added this pass).
--
-- This file is a manual-setup convenience only. The authoritative schema
-- is Django's migration history in backend/api/migrations/ — if you can
-- run `python manage.py migrate` against your MySQL database, prefer that
-- over importing this file, since it also records migration state that
-- this file does not. Use this file only if you need to hand-inspect or
-- hand-provision the schema without running Django.
--
-- Usage: mysql -u <user> -p <db_name> < database.sql

SET FOREIGN_KEY_CHECKS = 0;

-- Optional: create database
-- CREATE DATABASE kag_unity_pwa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE kag_unity_pwa;

-- ============================
-- Auth model (Django creates this normally)
-- ============================

CREATE TABLE IF NOT EXISTS auth_user (
  id bigint NOT NULL AUTO_INCREMENT,
  password varchar(128) NOT NULL,
  last_login datetime(6) NULL,
  is_superuser tinyint(1) NOT NULL,
  username varchar(150) NOT NULL,
  first_name varchar(150) NOT NULL,
  last_name varchar(150) NOT NULL,
  email varchar(254) NOT NULL,
  is_staff tinyint(1) NOT NULL,
  is_active tinyint(1) NOT NULL,
  date_joined datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY auth_user_username_key (username),
  UNIQUE KEY auth_user_email_key (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Ministries (created early: referenced by Event, MemberMinistry,
-- DepartmentAdminAssignment, DepartmentAttendance*, Announcement)
-- ============================

CREATE TABLE IF NOT EXISTS api_ministry (
  id bigint NOT NULL AUTO_INCREMENT,
  ministry_name varchar(255) NOT NULL,
  description longtext NOT NULL,
  leader varchar(150) NOT NULL,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Sermons, Events, Registrations, Prayer Requests
-- ============================

CREATE TABLE IF NOT EXISTS api_sermon (
  id bigint NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  speaker varchar(150) NOT NULL,
  category varchar(100) NOT NULL,
  video_url varchar(2048) NULL,
  audio_url varchar(2048) NULL,
  notes_url varchar(2048) NULL,
  summary longtext NULL,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ministry_id: NULL = church-wide event, set = department-scoped event
CREATE TABLE IF NOT EXISTS api_event (
  id bigint NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  description longtext NOT NULL,
  date datetime(6) NOT NULL,
  venue varchar(255) NOT NULL,
  image varchar(2048) NULL,
  created_at datetime(6) NOT NULL,
  ministry_id bigint NULL,
  PRIMARY KEY (id),
  KEY api_event_ministry_id_idx (ministry_id),
  CONSTRAINT api_event_ministry_fk
    FOREIGN KEY (ministry_id) REFERENCES api_ministry (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_eventregistration (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NULL,
  event_id bigint NOT NULL,
  full_name varchar(255) NOT NULL DEFAULT '',
  phone varchar(20) NOT NULL DEFAULT '',
  status varchar(50) NOT NULL DEFAULT 'Registered',
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  KEY api_eventregistration_event_id_idx (event_id),
  CONSTRAINT api_eventregistration_event_fk
    FOREIGN KEY (event_id) REFERENCES api_event (id) ON DELETE CASCADE,
  CONSTRAINT api_eventregistration_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_prayerrequest (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NULL,
  request longtext NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'Pending',
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  KEY api_prayerrequest_user_id_idx (user_id),
  CONSTRAINT api_prayerrequest_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Giving
-- ============================

CREATE TABLE IF NOT EXISTS api_donation (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NULL,
  amount decimal(12,2) NOT NULL,
  category varchar(50) NOT NULL,
  mpesa_reference varchar(255) NOT NULL DEFAULT '',
  paybill_number varchar(20) NOT NULL DEFAULT '',
  giving_source varchar(20) NOT NULL DEFAULT 'online',
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  KEY api_donation_user_id_idx (user_id),
  CONSTRAINT api_donation_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Announcements (church-wide when ministry_id is NULL, department-scoped otherwise)
-- ============================

CREATE TABLE IF NOT EXISTS api_announcement (
  id bigint NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  body longtext NOT NULL,
  ministry_id bigint NULL,
  created_by_id bigint NULL,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  KEY api_announcement_ministry_id_idx (ministry_id),
  KEY api_announcement_created_by_id_idx (created_by_id),
  CONSTRAINT api_announcement_ministry_fk
    FOREIGN KEY (ministry_id) REFERENCES api_ministry (id) ON DELETE CASCADE,
  CONSTRAINT api_announcement_created_by_fk
    FOREIGN KEY (created_by_id) REFERENCES auth_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Notifications / Push
-- ============================

CREATE TABLE IF NOT EXISTS api_notification (
  id bigint NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  message longtext NOT NULL,
  user_id bigint NULL,
  is_sent tinyint(1) NOT NULL DEFAULT 0,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  KEY api_notification_user_id_idx (user_id),
  CONSTRAINT api_notification_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Web push subscription storage
CREATE TABLE IF NOT EXISTS api_devicetoken (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  endpoint varchar(500) NOT NULL DEFAULT '',
  p256dh varchar(500) NOT NULL DEFAULT '',
  auth varchar(500) NOT NULL DEFAULT '',
  platform varchar(100) NOT NULL DEFAULT '',
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_devicetoken_endpoint_uq (endpoint),
  KEY api_devicetoken_user_id_idx (user_id),
  CONSTRAINT api_devicetoken_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Member profile, approval status, verification
-- ============================

CREATE TABLE IF NOT EXISTS api_memberprofile (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  phone varchar(20) NULL,
  role varchar(30) NOT NULL DEFAULT 'Visitor',
  status varchar(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
  email_verified tinyint(1) NOT NULL DEFAULT 0,
  phone_verified tinyint(1) NOT NULL DEFAULT 0,
  profile_image varchar(2048) NULL,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_memberprofile_user_id_uq (user_id),
  CONSTRAINT api_memberprofile_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Role change audit trail (RoleAuditLog)
CREATE TABLE IF NOT EXISTS api_roleauditlog (
  id bigint NOT NULL AUTO_INCREMENT,
  actor_id bigint NULL,
  target_user_id bigint NOT NULL,
  old_role varchar(30) NOT NULL DEFAULT '',
  new_role varchar(30) NOT NULL DEFAULT '',
  reason longtext NOT NULL,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  KEY api_roleauditlog_actor_id_idx (actor_id),
  KEY api_roleauditlog_target_user_id_idx (target_user_id),
  CONSTRAINT api_roleauditlog_actor_fk
    FOREIGN KEY (actor_id) REFERENCES auth_user (id) ON DELETE SET NULL,
  CONSTRAINT api_roleauditlog_target_user_fk
    FOREIGN KEY (target_user_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Email verification / password reset OTPs (DB-backed, actually emailed)
CREATE TABLE IF NOT EXISTS api_emailverificationotp (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  email varchar(254) NOT NULL,
  otp_code varchar(10) NOT NULL,
  purpose varchar(50) NOT NULL DEFAULT 'email_verification',
  created_at datetime(6) NOT NULL,
  expires_at datetime(6) NOT NULL,
  attempts int unsigned NOT NULL DEFAULT 0,
  max_attempts int unsigned NOT NULL DEFAULT 5,
  is_verified tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY api_emailverificationotp_user_id_idx (user_id),
  KEY api_emailverificationotp_email_idx (email),
  KEY api_emailverificationotp_expires_at_idx (expires_at),
  CONSTRAINT api_emailverificationotp_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_passwordresetotp (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  email varchar(254) NOT NULL,
  otp_code varchar(10) NOT NULL,
  purpose varchar(50) NOT NULL DEFAULT 'password_reset',
  created_at datetime(6) NOT NULL,
  expires_at datetime(6) NOT NULL,
  attempts int unsigned NOT NULL DEFAULT 0,
  max_attempts int unsigned NOT NULL DEFAULT 5,
  is_used tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY api_passwordresetotp_user_id_idx (user_id),
  KEY api_passwordresetotp_email_idx (email),
  KEY api_passwordresetotp_expires_at_idx (expires_at),
  CONSTRAINT api_passwordresetotp_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contact messages
CREATE TABLE IF NOT EXISTS api_contactmessage (
  id bigint NOT NULL AUTO_INCREMENT,
  full_name varchar(255) NOT NULL,
  email varchar(254) NOT NULL,
  subject varchar(255) NOT NULL,
  message longtext NOT NULL,
  reply_text longtext NOT NULL DEFAULT '',
  replied_at datetime(6) NULL,
  user_id bigint NULL,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  KEY api_contactmessage_user_id_idx (user_id),
  CONSTRAINT api_contactmessage_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Homecell / ministry enrollment
-- ============================

CREATE TABLE IF NOT EXISTS api_homecell (
  id bigint NOT NULL AUTO_INCREMENT,
  `key` varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_homecell_key_uq (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_memberhomecell (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  homecell_id bigint NOT NULL,
  created_at datetime(6) NOT NULL,
  updated_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_memberhomecell_user_id_uq (user_id),
  KEY api_memberhomecell_homecell_id_idx (homecell_id),
  CONSTRAINT api_memberhomecell_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE,
  CONSTRAINT api_memberhomecell_homecell_fk
    FOREIGN KEY (homecell_id) REFERENCES api_homecell (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_memberministry (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  ministry_id bigint NOT NULL,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_memberministry_user_ministry_uq (user_id, ministry_id),
  KEY api_memberministry_ministry_id_idx (ministry_id),
  CONSTRAINT api_memberministry_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE,
  CONSTRAINT api_memberministry_ministry_fk
    FOREIGN KEY (ministry_id) REFERENCES api_ministry (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Department Administrator assignment
-- ============================

CREATE TABLE IF NOT EXISTS api_departmentadminassignment (
  id bigint NOT NULL AUTO_INCREMENT,
  department_id bigint NOT NULL,
  admin_user_id bigint NOT NULL,
  church_admin_user_id bigint NOT NULL,
  created_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_deptadminassign_dept_admin_uq (department_id, admin_user_id),
  KEY api_deptadminassign_admin_user_id_idx (admin_user_id),
  KEY api_deptadminassign_church_admin_user_id_idx (church_admin_user_id),
  CONSTRAINT api_deptadminassign_department_fk
    FOREIGN KEY (department_id) REFERENCES api_ministry (id) ON DELETE CASCADE,
  CONSTRAINT api_deptadminassign_admin_user_fk
    FOREIGN KEY (admin_user_id) REFERENCES auth_user (id) ON DELETE CASCADE,
  CONSTRAINT api_deptadminassign_church_admin_user_fk
    FOREIGN KEY (church_admin_user_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Department / ministry attendance (general, non-children)
-- ============================

CREATE TABLE IF NOT EXISTS api_departmentattendancesession (
  id bigint NOT NULL AUTO_INCREMENT,
  ministry_id bigint NOT NULL,
  title varchar(255) NOT NULL DEFAULT '',
  session_date date NOT NULL,
  start_time time(6) NULL,
  end_time time(6) NULL,
  notes longtext NOT NULL DEFAULT '',
  created_at datetime(6) NOT NULL,
  updated_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  KEY api_deptattsession_ministry_date_idx (ministry_id, session_date),
  CONSTRAINT api_deptattsession_ministry_fk
    FOREIGN KEY (ministry_id) REFERENCES api_ministry (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_departmentattendancerecord (
  id bigint NOT NULL AUTO_INCREMENT,
  session_id bigint NOT NULL,
  member_id bigint NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'present',
  marked_by_id bigint NULL,
  created_at datetime(6) NOT NULL,
  updated_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_deptattrecord_session_member_uq (session_id, member_id),
  KEY api_deptattrecord_marked_by_id_idx (marked_by_id),
  CONSTRAINT api_deptattrecord_session_fk
    FOREIGN KEY (session_id) REFERENCES api_departmentattendancesession (id) ON DELETE CASCADE,
  CONSTRAINT api_deptattrecord_member_fk
    FOREIGN KEY (member_id) REFERENCES auth_user (id) ON DELETE CASCADE,
  CONSTRAINT api_deptattrecord_marked_by_fk
    FOREIGN KEY (marked_by_id) REFERENCES auth_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================
-- Children's Ministry (admin-managed; no self-service login role)
-- ============================

CREATE TABLE IF NOT EXISTS api_guardianprofile (
  id bigint NOT NULL AUTO_INCREMENT,
  user_id bigint NOT NULL,
  full_name varchar(255) NOT NULL,
  phone varchar(30) NOT NULL DEFAULT '',
  email varchar(254) NOT NULL DEFAULT '',
  created_at datetime(6) NOT NULL,
  updated_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_guardianprofile_user_id_uq (user_id),
  CONSTRAINT api_guardianprofile_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_childprofile (
  id bigint NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  gender varchar(20) NOT NULL DEFAULT '',
  date_of_birth date NULL,
  created_at datetime(6) NOT NULL,
  updated_at datetime(6) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Many-to-many: a child can have multiple guardians, a guardian multiple children
CREATE TABLE IF NOT EXISTS api_childprofile_guardians (
  id bigint NOT NULL AUTO_INCREMENT,
  childprofile_id bigint NOT NULL,
  guardianprofile_id bigint NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_childprofile_guardians_uq (childprofile_id, guardianprofile_id),
  KEY api_childprofile_guardians_guardian_id_idx (guardianprofile_id),
  CONSTRAINT api_childprofile_guardians_child_fk
    FOREIGN KEY (childprofile_id) REFERENCES api_childprofile (id) ON DELETE CASCADE,
  CONSTRAINT api_childprofile_guardians_guardian_fk
    FOREIGN KEY (guardianprofile_id) REFERENCES api_guardianprofile (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_childmedicalinfo (
  id bigint NOT NULL AUTO_INCREMENT,
  child_id bigint NOT NULL,
  allergies longtext NOT NULL DEFAULT '',
  medications longtext NOT NULL DEFAULT '',
  conditions longtext NOT NULL DEFAULT '',
  emergency_contact_name varchar(255) NOT NULL DEFAULT '',
  emergency_contact_phone varchar(30) NOT NULL DEFAULT '',
  created_at datetime(6) NOT NULL,
  updated_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_childmedicalinfo_child_id_uq (child_id),
  CONSTRAINT api_childmedicalinfo_child_fk
    FOREIGN KEY (child_id) REFERENCES api_childprofile (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_childattendancesession (
  id bigint NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL DEFAULT '',
  session_date date NOT NULL,
  start_time time(6) NULL,
  end_time time(6) NULL,
  notes longtext NOT NULL DEFAULT '',
  created_at datetime(6) NOT NULL,
  updated_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  KEY api_childattsession_session_date_idx (session_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_childattendancerecord (
  id bigint NOT NULL AUTO_INCREMENT,
  session_id bigint NOT NULL,
  child_id bigint NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'present',
  marked_by_id bigint NULL,
  created_at datetime(6) NOT NULL,
  updated_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY api_childattrecord_session_child_uq (session_id, child_id),
  KEY api_childattrecord_marked_by_id_idx (marked_by_id),
  CONSTRAINT api_childattrecord_session_fk
    FOREIGN KEY (session_id) REFERENCES api_childattendancesession (id) ON DELETE CASCADE,
  CONSTRAINT api_childattrecord_child_fk
    FOREIGN KEY (child_id) REFERENCES api_childprofile (id) ON DELETE CASCADE,
  CONSTRAINT api_childattrecord_marked_by_fk
    FOREIGN KEY (marked_by_id) REFERENCES auth_user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- Usage:
-- mysql -u <user> -p <db_name> < database.sql

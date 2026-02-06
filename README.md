# Forge - Gym Workout & Habit Tracker

A mobile fitness companion that helps you track workouts, build consistency, and monitor your progress. Built with React Native and Expo, this app makes it easy to plan your training, log your sessions, and stay motivated with visual progress tracking.

## What's Inside

### Workout Management

- **Create Custom Workouts**: Build your own workout routines with multiple exercises
- **Exercise Library**: Add exercises with sets, reps, and optional media (images/videos from YouTube)
- **Weekly Planning**: Schedule workouts for specific days of the week
- **Quick Edit**: Modify workouts and exercises on the fly

### Session Tracking

- **Live Workout Sessions**: Start a session and log your sets in real-time
- **Rest Timer**: Built-in timer to track rest periods between sets
- **Session History**: View all your past workouts with detailed stats
- **Performance Metrics**: Track total reps, sets, and weight lifted per session

### Progress Monitoring

- **Progress Photos**: Take and organize photos to visualize your transformation
- **Photo Gallery**: Browse your progress photos by date
- **Session Notes**: Add notes to your workouts for future reference

### Analytics & Insights

- **Weekly Activity Chart**: See your workout frequency over time
- **Exercise Performance**: Track personal records and improvements
- **Consistency Tracking**: Monitor your workout streak
- **Volume Analysis**: Understand your training load

### Smart Features

- **Daily Reminders**: Set custom workout reminders for specific days
- **Cloud Sync**: Your data syncs across devices via Supabase
- **Offline Support**: Local SQLite database ensures the app works without internet
- **Auto-save**: Never lose your workout data

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/lakshya75way/Gym-Workout-Habit-Tracker-Mobile-App.git
cd Assessment_4_native
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase:

You'll need to create the following tables in your Supabase project:

**workouts**

```sql
CREATE TABLE workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  day_mask INTEGER DEFAULT 0,
  muscle_group TEXT NOT NULL,
  image_uri TEXT,
  video_uri TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT
);
```

**exercises**

```sql
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workout_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  sort_order INTEGER DEFAULT 0,
  image_uri TEXT,
  video_uri TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
);
```

**sessions**

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workout_id TEXT NOT NULL,
  workout_name TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
);
```

**logs**

```sql
CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  weight REAL,
  reps_completed INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
);
```

**progress_photos**

```sql
CREATE TABLE progress_photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  uri TEXT NOT NULL,
  taken_at TEXT NOT NULL,
  note TEXT,
  session_id TEXT,
  workout_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT
);
```

5. Set up Supabase Storage:

Create two storage buckets:

- `progress-photos` (public)
- `workout-media` (public)

Enable RLS policies for authenticated users:

```sql
-- Allow authenticated users to upload to progress-photos
CREATE POLICY "Users can upload progress photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'progress-photos');

-- Allow authenticated users to upload to workout-media
CREATE POLICY "Users can upload workout media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'workout-media');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('progress-photos', 'workout-media'));
```

### Running the App

Start the development server:

```bash
npm start
```

Run on specific platforms:

```bash
npm run android  # Android
npm run ios      # iOS
npm run web      # Web browser
```

### Building for Production

**Android APK:**

```bash
cd android
./gradlew assembleRelease
```

The APK will be located at: `android/app/build/outputs/apk/release/app-release.apk`

**iOS:**

```bash
npm run ios -- --configuration Release
```

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **State Management**: Zustand
- **Database**:
  - Local: SQLite (expo-sqlite)
  - Cloud: Supabase (PostgreSQL)
- **Storage**:
  - Local: MMKV (react-native-mmkv)
  - Cloud: Supabase Storage
- **Validation**: Zod
- **Charts**: react-native-chart-kit
- **Media**: expo-image-picker, expo-av
- **Notifications**: expo-notifications

## Project Structure

```
src/
├── app.tsx                 # App entry point with error handling
├── config.ts              # Environment configuration
├── navigation/            # Navigation setup
├── features/              # Feature modules
│   ├── analytics/        # Workout analytics and charts
│   ├── auth/             # Authentication (login/register)
│   ├── progress/         # Progress photos
│   ├── reminders/        # Workout reminders
│   ├── sessions/         # Workout sessions
│   └── workouts/         # Workout management
├── services/             # API and sync services
│   ├── supabase.ts      # Supabase client
│   ├── sync.service.ts  # Cloud sync logic
│   ├── media.service.ts # Media upload
│   └── notification.service.ts
├── database/             # Local SQLite setup
├── storage/              # MMKV storage wrapper
├── theme/                # App theming
└── components/           # Shared components
```

## Features Breakdown

### Authentication

- Email/password registration with verification
- Secure login with session management
- Auto-sync on login
- Profile management

### Workout Planning

- Create unlimited workouts
- Add multiple exercises per workout
- Set target sets and reps
- Attach YouTube videos for exercise demos
- Schedule workouts for specific weekdays

### Active Sessions

- Start workout sessions with one tap
- Log sets with weight and reps
- Mark sets as complete
- Pause and resume sessions
- Automatic session duration tracking

### Data Sync

- Automatic cloud backup
- Conflict-free sync across devices
- Offline-first architecture
- Media upload to cloud storage

### Notifications

- Custom reminder times
- Select specific days for reminders
- Persistent notifications

## Environment Variables

Create a `.env` file with these variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Troubleshooting

**App won't start:**

- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Sync not working:**

- Check your Supabase credentials in `.env`
- Verify RLS policies are set up correctly
- Check network connection

**Media upload fails:**

- Ensure storage buckets exist in Supabase
- Verify bucket permissions are set to public
- Check RLS policies for storage

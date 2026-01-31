type Profile = {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export default function ProfileCard({ profile }: { profile: Profile }) {
  const title = profile.display_name?.trim() || profile.username;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/10">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-white/60">@{profile.username}</p>
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-5 whitespace-pre-line text-white/80">{profile.bio}</p>
      ) : (
        <p className="mt-5 text-white/50">Aucune bio pour le moment.</p>
      )}
    </div>
  );
}

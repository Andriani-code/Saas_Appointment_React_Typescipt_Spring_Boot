type AvatarProps = {
  src?: string;
  name: string;
};

export const Avatar = ({ src, name }: AvatarProps) => {
  return src ? (
    <img
      src={src}
      className="w-10 h-10 rounded-full object-cover"
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
      {name[0]}
    </div>
  );
};
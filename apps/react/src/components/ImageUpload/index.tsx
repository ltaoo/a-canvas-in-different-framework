import "./index.less";

interface IProps {
  children: React.ReactNode;
  /**
   * 文件上传后的回调
   */
  onChange: (
    url: string,
    detail: { file: File; width: number; height: number; suffix?: string }
  ) => void;
}

const ImageUpload: React.FC<IProps> = (props) => {
  const { children, onChange } = props;
  return (
    <div className="upload">
      <div className="upload__content">{children}</div>
      <input
        className="upload__input"
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={async (event) => {
          // console.log(event.target.files);
          if (event.target.files === null) {
            return;
          }
          const file = event.target.files[0];
          const url = URL.createObjectURL(file);
          const $image = document.createElement("img");
          $image.src = url;
          $image.onload = () => {
            const { naturalHeight: height, naturalWidth: width } = $image;
            if (onChange) {
              onChange(url, {
                file,
                width,
                height,
              });
            }
          };
        }}
      />
    </div>
  );
};

export default ImageUpload;

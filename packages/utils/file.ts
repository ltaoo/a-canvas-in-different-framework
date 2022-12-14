/**
 * 从文件对象获取可访问的 blob 地址
 */
export function fetchBlobForFile(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(URL.createObjectURL(base64data));
    };
  });
}

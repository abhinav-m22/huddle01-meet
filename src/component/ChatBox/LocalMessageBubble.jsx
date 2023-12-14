function LocalMessageBubble({ message }) {

  return (
    <div className="w-full items-end flex flex-col bg-white rounded-lg">
      <span className="text-white text-sm">{message.text}</span>
    </div>
  );
}

export default LocalMessageBubble;

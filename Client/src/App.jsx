import { Route, Routes } from "react-router-dom";

export const Home = () => {
  return <div>home</div>;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
};

export default App;

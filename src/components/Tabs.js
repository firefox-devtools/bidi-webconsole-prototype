import React from "react";

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  const activeTabContent = tabs.find((tab) => tab.id === activeTab).content;

  return (
    <>
      <div className="devtools-tabbar">
        <div className="toolbox-tabs-wrapper">
          <div className="toolbox-tabs">
            {tabs.map((tab) => (
              <button
                className={`devtools-tab${
                  activeTab === tab.id ? " selected" : ""
                }`}
                id="toolbox-tab-webconsole"
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="devtools-tab-line"></span>
                <img alt="" src={tab.icon} />
                <span className="devtools-tab-label">{tab.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {activeTabContent}
    </>
  );
};

export default Tabs;

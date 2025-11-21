import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';

export default function Revision() {
  // Load initial data from localStorage or use default
  const loadInitialData = () => {
    const savedData = localStorage.getItem('faqTopics');
    if (savedData) {
      return JSON.parse(savedData);
    }
    return [
      {
        id: 1,
        name: 'Getting Started',
        questions: [
          { id: 1, question: 'How do I create an account?', answer: 'Click on the Sign Up button and fill in your details.' },
          { id: 2, question: 'Is there a mobile app?', answer: 'Yes, we have apps available for both iOS and Android.' }
        ]
      }
    ];
  };

  const [topics, setTopics] = useState(loadInitialData);
  
  // Save to localStorage whenever topics change
  useEffect(() => {
    localStorage.setItem('faqTopics', JSON.stringify(topics));
  }, [topics]);
  
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [newTopicName, setNewTopicName] = useState('');
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({});
  const [showQuestionForm, setShowQuestionForm] = useState({});

  const toggleQuestion = (topicId, questionId) => {
    const key = `${topicId}-${questionId}`;
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addTopic = () => {
    if (newTopicName.trim()) {
      const newTopic = {
        id: Date.now(),
        name: newTopicName,
        questions: []
      };
      setTopics([...topics, newTopic]);
      setNewTopicName('');
      setShowTopicForm(false);
    }
  };

  const addQuestion = (topicId) => {
    const question = newQuestion[topicId]?.question;
    const answer = newQuestion[topicId]?.answer;
    
    if (question && answer) {
      setTopics(topics.map(topic => {
        if (topic.id === topicId) {
          return {
            ...topic,
            questions: [
              ...topic.questions,
              { id: Date.now(), question, answer }
            ]
          };
        }
        return topic;
      }));
      
      setNewQuestion(prev => ({
        ...prev,
        [topicId]: { question: '', answer: '' }
      }));
      setShowQuestionForm(prev => ({
        ...prev,
        [topicId]: false
      }));
    }
  };

  const deleteTopic = (topicId) => {
    setTopics(topics.filter(topic => topic.id !== topicId));
  };

  const deleteQuestion = (topicId, questionId) => {
    setTopics(topics.map(topic => {
      if (topic.id === topicId) {
        return {
          ...topic,
          questions: topic.questions.filter(q => q.id !== questionId)
        };
      }
      return topic;
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">FAQ Manager</h1>
          <p className="text-gray-600">Organize your questions and answers by topics</p>
        </div>

        {/* Add Topic Button */}
        <div className="mb-6">
          {!showTopicForm ? (
            <button
              onClick={() => setShowTopicForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus size={20} />
              Add New Topic
            </button>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Enter topic name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={addTopic}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Add Topic
                </button>
                <button
                  onClick={() => {
                    setShowTopicForm(false);
                    setNewTopicName('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Topics and Questions */}
        <div className="space-y-6">
          {topics.map(topic => (
            <div key={topic.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-800">{topic.name}</h2>
                <button
                  onClick={() => deleteTopic(topic.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Questions */}
              <div className="space-y-3 mb-4">
                {topic.questions.map(q => {
                  const key = `${topic.id}-${q.id}`;
                  const isExpanded = expandedQuestions[key];
                  
                  return (
                    <div key={q.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        onClick={() => toggleQuestion(topic.id, q.id)}
                        className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
                      >
                        <h3 className="font-semibold text-gray-800 flex-1">{q.question}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQuestion(topic.id, q.id);
                            }}
                            className="text-red-500 hover:text-red-700 transition p-1"
                          >
                            <X size={16} />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="text-indigo-600" size={20} />
                          ) : (
                            <ChevronDown className="text-indigo-600" size={20} />
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <p className="text-gray-700">{q.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Question Form */}
              {!showQuestionForm[topic.id] ? (
                <button
                  onClick={() => setShowQuestionForm(prev => ({ ...prev, [topic.id]: true }))}
                  className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Question
                </button>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    value={newQuestion[topic.id]?.question || ''}
                    onChange={(e) => setNewQuestion(prev => ({
                      ...prev,
                      [topic.id]: { ...prev[topic.id], question: e.target.value }
                    }))}
                    placeholder="Enter question"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    value={newQuestion[topic.id]?.answer || ''}
                    onChange={(e) => setNewQuestion(prev => ({
                      ...prev,
                      [topic.id]: { ...prev[topic.id], answer: e.target.value }
                    }))}
                    placeholder="Enter answer"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => addQuestion(topic.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Add Question
                    </button>
                    <button
                      onClick={() => {
                        setShowQuestionForm(prev => ({ ...prev, [topic.id]: false }));
                        setNewQuestion(prev => ({
                          ...prev,
                          [topic.id]: { question: '', answer: '' }
                        }));
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No topics yet. Add your first topic to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
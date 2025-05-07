import { useEffect, useState, useCallback } from 'react';
import './App.css';

function App() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [deadline, setDeadline] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
  }, [darkMode]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3050/categories");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const categoriesData = await res.json();

        const categoriesWithCounts = await Promise.all(
          categoriesData.map(async (category) => {
            try {
              const resCounts = await fetch(`http://localhost:3050/category_task_counts/${category.id}`);
              if (!resCounts.ok) throw new Error(`HTTP error! status: ${resCounts.status}`);
              const counts = await resCounts.json();
              return {
                ...category,
                counts: {
                  open_tasks: counts?.open_tasks ?? 0,
                  completed_tasks: counts?.completed_tasks ?? 0,
                },
              };
            } catch {
              return { ...category, counts: { open_tasks: 0, completed_tasks: 0 } };
            }
          })
        );
        setCategories(categoriesWithCounts);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch tasks for the selected category
  useEffect(() => {
    if (!selectedCategory) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch(`http://localhost:3050/tasks/${selectedCategory}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const tasksData = await res.json();
        setTasks(tasksData);
      } catch (error) {
        console.error("Error loading tasks:", error);
      }
    };

    fetchTasks();
  }, [selectedCategory]);

  // Add a new task
  const addTask = useCallback(async () => {
    if (!title.trim() || !selectedCategory) return;

    try {
      const res = await fetch("http://localhost:3050/add_task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, completed: false, deadline, note, category_id: selectedCategory }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const newTask = await res.json();

      setTasks((prev) => [...prev, newTask]);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategory
            ? { ...cat, counts: { ...cat.counts, open_tasks: (cat.counts?.open_tasks ?? 0) + 1 } }
            : cat
        )
      );
      setTitle("");
      setDeadline("");
      setNote("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
  }, [title, deadline, note, selectedCategory]);

  // Add a new category
  const addCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("http://localhost:3050/add_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const newCategory = await res.json();

      setCategories((prev) => [
        ...prev,
        { ...newCategory, counts: { open_tasks: 0, completed_tasks: 0 } },
      ]);
      setNewCategoryName("");
    } catch (error) {
      console.error("Error adding category:", error);
    }
  }, [newCategoryName]);

  // Delete a category
  const deleteCategory = useCallback(async (id) => {
    const categoryToDelete = categories.find((cat) => cat.id === id);
    if (!categoryToDelete) return;

    if (
      categoryToDelete.counts?.open_tasks > 0 ||
      categoryToDelete.counts?.completed_tasks > 0
    ) {
      const confirmDelete = window.confirm(
        `The category "${categoryToDelete.name}" still contains tasks. Delete anyway?`
      );
      if (!confirmDelete) return;
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    if (selectedCategory === id) setSelectedCategory(null);

    try {
      const res = await fetch(`http://localhost:3050/delete_category/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  }, [categories, selectedCategory]);

  // Update task status
  const updateTaskStatus = useCallback(async (id, completed) => {
    const newCompletedStatus = !completed;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: newCompletedStatus } : task
      )
    );

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === selectedCategory
          ? {
              ...cat,
              counts: {
                open_tasks: (cat.counts?.open_tasks ?? 0) + (newCompletedStatus ? -1 : 1),
                completed_tasks: (cat.counts?.completed_tasks ?? 0) + (newCompletedStatus ? 1 : -1),
              },
            }
          : cat
      )
    );

    try {
      const res = await fetch(`http://localhost:3050/update_completed/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompletedStatus }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  }, [selectedCategory]);

  // Delete a task
  const deleteTask = useCallback(async (id) => {
    const taskToDelete = tasks.find((task) => task.id === id);
    if (!taskToDelete) return;

    setTasks((prev) => prev.filter((task) => task.id !== id));
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === selectedCategory
          ? {
              ...cat,
              counts: {
                open_tasks: (cat.counts?.open_tasks ?? 0) + (taskToDelete.completed ? 0 : -1),
                completed_tasks: (cat.counts?.completed_tasks ?? 0) + (taskToDelete.completed ? -1 : 0),
              },
            }
          : cat
      )
    );

    try {
      const res = await fetch(`http://localhost:3050/delete/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }, [tasks, selectedCategory]);

  return (
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      <div className="header">
        <h1>To-Do List</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="mode-toggle">
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="category-selection">
        {!selectedCategory ? (
          <>
            <h2>Select a Category</h2>
            <div className="category-buttons">
              {categories.map(({ id, name, counts }) => (
                <div key={id} className="category-item">
                  <button onClick={() => setSelectedCategory(id)}>
                    {name} ({counts?.open_tasks ?? 0}/{counts?.completed_tasks ?? 0})
                  </button>
                  <button onClick={() => deleteCategory(id)} className="delete-button">🗑️</button>
                </div>
              ))}
            </div>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New Category..."
            />
            <button onClick={addCategory}>Add Category</button>
          </>
        ) : (
          <button onClick={() => setSelectedCategory(null)}>Back to Categories</button>
        )}
      </div>

      {selectedCategory && (
        <>
          <div className="task-input">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New Task..."
            />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
            />
            <button disabled={!title.trim()} onClick={addTask}>Add Task</button>
          </div>

          <ul className="task-list">
            <h2>Open Tasks</h2>
            {tasks.filter((task) => !task.completed).map(({ id, title, completed, deadline, note }) => (
              <li key={id}>
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={() => updateTaskStatus(id, completed)}
                />
                <span className={`task-text ${completed ? 'completed' : 'pending'}`}>{title}</span>
                <p>Deadline: {deadline ? new Date(deadline).toLocaleString() : "None"}</p>
                <textarea
                  value={note || ""}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                />
                <button onClick={() => deleteTask(id)} style={{ color: 'red' }}>X</button>
              </li>
            ))}

            <h2>Completed Tasks</h2>
            {tasks.filter((task) => task.completed).map(({ id, title, completed, deadline, note }) => (
              <li key={id}>
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={() => updateTaskStatus(id, completed)}
                />
                <span className={`task-text ${completed ? 'completed' : 'pending'}`}>{title}</span>
                <p>Deadline: {deadline ? new Date(deadline).toLocaleString() : "None"}</p>
                <textarea
                  value={note || ""}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                />
                <button onClick={() => deleteTask(id)} style={{ color: 'red' }}>X</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
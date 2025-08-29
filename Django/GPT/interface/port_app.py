from abc import ABC, abstractmethod

class PortApp(ABC):
    def __init__(self, url: str, api_key: str, data: dict, user: str):
        self.url = url
        self.api_key = api_key
        self.data = data
        self.user = user

    @abstractmethod
    def talk(self):
        pass

    @abstractmethod
    def stop(self):
        pass
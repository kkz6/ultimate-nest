import { BaseRepository } from "@common/database";
import { Conversation, Message, User } from "@entities";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Injectable } from "@nestjs/common";

interface IConversation {
	users: User[];
	message: string;
}

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(Conversation)
		private readonly conversationRepository: BaseRepository<Conversation>,
		@InjectRepository(Message) private readonly messageRepository: BaseRepository<Message>,
	) {}

	async createConversation(conversation: IConversation) {
		const conversationNew = this.conversationRepository.create(conversation);

		await this.conversationRepository.persistAndFlush(conversationNew);
	}

	async sendMessage(data: IConversation) {
		const [sender, receiver] = data.users;
		const conversationExists = await this.getConversation(sender.id, receiver.id);

		const messageNew = this.messageRepository.create({
			body: data.message,
		});

		if (conversationExists) {
			messageNew.conversation = conversationExists;
			conversationExists.messages.add(messageNew);

			await Promise.all([
				this.messageRepository.persistAndFlush(messageNew),
				this.conversationRepository.flush(),
			]);
		} else {
			const conversationNew = this.conversationRepository.create({
				users: data.users,
				messages: [messageNew],
			});

			messageNew.conversation = conversationNew;

			await Promise.all([
				this.messageRepository.persistAndFlush(messageNew),
				this.conversationRepository.persistAndFlush(conversationNew),
			]);
		}
	}

	async getConversation(sender: number, receiver: number) {
		return this.conversationRepository.findOne({ users: [sender, receiver] });
	}

	async getConversationForUser(user: User) {
		const conversations = await this.conversationRepository
			.qb("c")
			.select("c.*")
			.leftJoinAndSelect("c.messages", "m")
			.join("user_conversation", "uc", "c.id = uc.conversation_id")
			.where("uc.user_id = ?", [user.id])
			.execute();

		return conversations;
	}

	async markMessagesAsSeen(sender: number, receiver: number): Promise<Conversation> {
		const conversation = await this.getConversation(sender, receiver);

		await this.messageRepository.nativeUpdate(
			{
				conversation: conversation.id,
			},
			{
				isRead: true,
				readAt: new Date(),
			},
		);
		
return conversation;
	}
}
